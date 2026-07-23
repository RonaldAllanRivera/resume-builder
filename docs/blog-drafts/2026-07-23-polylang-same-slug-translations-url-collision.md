---
title: 'Why /en/faq/ loads your German page — fixing Polylang''s same-slug collision'
slug: polylang-same-slug-translations-url-collision
metaDescription: 'Polylang translations that share a slug get de-duplicated to faq-2 and resolve to the wrong language. Two filters fix both halves: language-aware page resolution and a cross-language slug exception.'
status: draft
---

You have a bilingual WordPress site running Polylang. German is the default, English lives under `/en/`. You want the obvious URLs:

```
/faq/      → German FAQ
/en/faq/   → English FAQ
```

Both fail, in two different and initially unrelated-looking ways.

**The slug won't stick.** You set the English page's slug to `faq`, save, and WordPress silently stores `faq-2`. You fix it. You hit Update in Elementor. It's `faq-2` again. Every single save reverts it.

**The URL loads the wrong language.** If you do force the slug, `/en/faq/` renders the *German* page — and then Polylang notices the mismatch and canonical-redirects `/en/faq/` → `/faq/`. Your English page becomes unreachable at its own URL.

These have separate root causes in WordPress core, and you need both fixed before either symptom goes away. That's why this one is so annoying to debug: fixing half of it changes nothing visible.

## Cause 1: post slugs are globally unique

WordPress enforces slug uniqueness per post type and parent, through `wp_unique_post_slug()`. It has no concept of language — that's a plugin's idea, and core predates it by a decade.

So when the German FAQ already owns `faq`, saving the English translation with the same slug is, as far as core is concerned, a duplicate. It appends `-2`. Correct behaviour for monolingual WordPress; wrong for a translated site, where the whole point is that `/faq/` and `/en/faq/` are different pages in different languages.

The Elementor detail matters practically: every "Update" re-runs the slug logic, so a manual database fix survives exactly until the next content edit. Anyone who has "fixed" this by hand has watched it come back.

## Cause 2: page resolution isn't language-aware

WordPress maps a URL to a post with `get_page_by_path()`. It queries by slug and **returns the first match**.

With two pages sharing `faq`, the first match is whichever core finds first — in practice the default-language page. Both `/faq/` and `/en/faq/` resolve to the German page.

Polylang then does something reasonable that makes it worse: it sees that the URL says English but the resolved page is German, decides the URL is wrong, and canonical-redirects to `/faq/`. From the outside this looks like Polylang breaking your English pages. It's actually Polylang cleaning up after a resolution that already went wrong upstream.

## Fix 1: a cross-language exception to slug uniqueness

The rule we want isn't "disable uniqueness" — that would break genuine duplicates and produce two same-language pages fighting over one URL. It's narrower:

> If core de-duplicated a slug, and every page already holding the requested slug is in a **different** language, give the requested slug back. If any conflict is in the **same** language, keep the `-2`.

```php
add_filter('wp_unique_post_slug', function ($slug, $post_ID, $post_status, $post_type, $post_parent, $original_slug) {
    if ($slug === $original_slug) return $slug;   // no de-dup happened → nothing to do
    if (!function_exists('pll_get_post_language')) return $slug;

    // language of the post being saved (fall back to the editor's language selector for new posts)
    $my_lang = pll_get_post_language($post_ID);
    if (!$my_lang && isset($_POST['post_lang_choice'])) {
        $my_lang = sanitize_key(wp_unslash($_POST['post_lang_choice']));
    }
    if (!$my_lang) return $slug;                  // can't tell → keep the safe de-duped slug

    // every post already holding the REQUESTED slug at this hierarchy level, any language
    $conflicts = get_posts([
        'post_type'   => $post_type,
        'name'        => $original_slug,
        'post_parent' => $post_parent,
        'post_status' => 'any',
        'numberposts' => -1,
        'fields'      => 'ids',
        'lang'        => '',                      // bypass Polylang's per-language filter
    ]);

    foreach ($conflicts as $cid) {
        if ((int) $cid === (int) $post_ID) continue;
        if (pll_get_post_language($cid) === $my_lang) {
            return $slug;                         // genuine same-language clash → keep "-2"
        }
    }

    return $original_slug;                        // only cross-language → allow the shared slug
}, 10, 6);
```

Three things in there are load-bearing and easy to get wrong:

**`'lang' => ''` in the query.** Polylang filters `get_posts()` by the current language by default. Without this, the conflict search only sees same-language posts — which is precisely the set you're trying to look past. You'd find no conflicts, always return the original slug, and hand yourself the same-language collision you were trying to avoid.

**The `post_lang_choice` fallback.** On a brand-new post, `pll_get_post_language()` has nothing to read yet; the language only exists in the editor's language selector at that moment. Without the fallback, new translations silently keep their `-2`.

**Early return when language is unknown.** If we can't determine the language, we keep core's de-duplicated slug. The failure mode of this filter should be "behaves like stock WordPress", never "hands out a slug that might collide".

## Fix 2: resolve the page in the URL's language

Now that both pages can hold `faq`, resolution has to pick the right one. Filter the query before WordPress runs it:

```php
add_filter('request', function ($qv) {
    if (is_admin() || empty($qv['pagename'])) return $qv;
    if (!function_exists('pll_get_post') || !function_exists('pll_default_language')
        || !function_exists('pll_languages_list') || !function_exists('pll_get_post_language')) {
        return $qv;
    }

    $page = get_page_by_path($qv['pagename']);   // not language-aware → may be the wrong language
    if (!$page) return $qv;

    // language implied by the URL: a "/en/…" prefix means 'en', otherwise the default
    $default  = pll_default_language();
    $path     = (string) wp_parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
    $url_lang = $default;
    foreach (pll_languages_list() as $slug) {
        if ($slug !== $default && (strpos($path, "/$slug/") === 0 || $path === "/$slug")) {
            $url_lang = $slug;
            break;
        }
    }

    $page_lang = pll_get_post_language($page->ID);
    if ($page_lang && $page_lang !== $url_lang) {
        $tr = pll_get_post($page->ID, $url_lang);   // the correct-language translation
        if ($tr && (int) $tr !== (int) $page->ID) {
            unset($qv['pagename'], $qv['name']);
            $qv['page_id'] = (int) $tr;             // force the right page
        }
    }

    return $qv;
}, 100);
```

The logic is: work out the language the URL is asking for, check the language of the page WordPress resolved, and if they disagree, swap the query to that page's translation.

Two design choices worth copying:

**It only acts on a genuine mismatch.** Pages with distinct slugs per language — `/produkte/` and `/en/products/` — resolve correctly on their own and are never touched. This filter is inert for the majority of your pages, which is what you want from something running on every front-end request.

**It's symmetric.** It fixes `/faq/` resolving to the English page just as readily as `/en/faq/` resolving to the German one. A one-directional fix works until someone creates a page in the non-default language first, at which point it breaks in the mirror image and looks like a completely new bug.

Swapping to `page_id` and unsetting `pagename` is the important mechanic: once you hand WordPress an explicit ID, path resolution is out of the picture entirely, and Polylang no longer sees a language mismatch to canonical-redirect away from.

## Why this is worth doing properly

The tempting shortcut is to accept `/en/faq-2/` and move on. Three reasons not to:

**It's user-visible.** `/en/faq-2/` in a nav bar, in a share, in a printed URL — it reads as broken, because it is.

**It breaks URL parity across languages.** If the German site serves `/faq/`, the English site should serve `/en/faq/`. Every mismatch is a special case someone has to remember when writing links, building menus, or setting up redirects.

**It compounds at migration time.** Migrating from another multilingual plugin, you're usually reproducing an existing live URL structure exactly — because those URLs have inbound links and rankings you don't want to break. "Close enough" slugs mean a redirect map for pages that never needed to change.

## Testing it

Both filters are conditional, so the tests that matter are the negative ones:

- **Same-language duplicate still gets `-2`.** Two German pages both requesting `faq` — the second must not steal the slug. This is the regression that would actually hurt.
- **Distinct-slug pages are untouched.** `/produkte/` and `/en/products/` resolve exactly as before.
- **Both directions resolve.** `/faq/` German, `/en/faq/` English, no redirect on either.
- **Plugin absent.** Deactivate Polylang and confirm the site behaves like stock WordPress. Both filters check `function_exists()` first for exactly this reason — a snippet that fatals when a plugin is disabled turns a routine deactivation into an outage.

## The general lesson

WordPress core guarantees slug uniqueness. Multilingual plugins need slug uniqueness *per language*. That's not a bug in either one — it's an assumption core made long before translation plugins existed, and there's no way for a plugin to relax it universally without breaking monolingual sites.

When a plugin can't safely change a core assumption, that's the seam where you end up writing the exception yourself. The trick is making it as narrow as possible: not "disable uniqueness", but "allow this one specific case, and only when we can positively confirm it's safe". Everything else keeps core's behaviour, including every case where we can't tell.

---

*Wrestling with a multilingual WordPress build or a plugin migration that has to preserve URLs exactly? [That's the kind of work I take on](/services).*
