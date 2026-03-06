# Delete Operations - Best Practices

## Overview

This document outlines the fixes applied to ensure all collections support reliable delete operations, even when relationships are invalid or missing.

## Problem

Delete operations were failing in some collections when:
- Related documents were already deleted (orphaned relationships)
- Relationship IDs were invalid
- Hooks tried to fetch non-existent related data

## Root Cause

Collection hooks (especially `afterRead` and `beforeChange`) that fetch related documents can throw errors when:
1. The related document doesn't exist
2. Access control prevents reading the related document
3. The relationship field contains invalid data

When Payload deletes a document, it reads it first, triggering `afterRead` hooks. If these hooks throw errors, the delete operation fails.

## Solution

### 1. Wrap All Hook Logic in Try-Catch Blocks

**Bad:**
```typescript
afterRead: [
  async ({ doc, req }) => {
    const relatedDoc = await req.payload.findByID({
      collection: 'companies',
      id: doc.companyId,
      req,
    })
    doc.companyName = relatedDoc.name
    return doc
  },
]
```

**Good:**
```typescript
afterRead: [
  async ({ doc, req }) => {
    try {
      const relatedDoc = await req.payload.findByID({
        collection: 'companies',
        id: doc.companyId,
        req,
      })
      doc.companyName = relatedDoc.name
      return doc
    } catch (error) {
      console.error('Error in afterRead hook:', error)
      return doc // Return doc as-is instead of throwing
    }
  },
]
```

### 2. Handle Missing Relationships Gracefully

```typescript
beforeChange: [
  async ({ data, req }) => {
    if (!data.companyId) return data // Skip if no relationship
    
    try {
      const company = await req.payload.findByID({
        collection: 'companies',
        id: data.companyId,
        req,
      })
      return {
        ...data,
        companyName: company.name,
      }
    } catch {
      // Company not found or access denied - continue without it
      return data
    }
  },
]
```

### 3. Use Nested Try-Catch for Individual Operations

```typescript
afterRead: [
  async ({ doc, req }) => {
    try {
      // Outer try-catch for the entire hook
      
      if (doc.authors?.length > 0) {
        for (const authorId of doc.authors) {
          try {
            // Inner try-catch for each author lookup
            const author = await req.payload.findByID({
              collection: 'users',
              id: authorId,
              req,
            })
            doc.populatedAuthors.push(author)
          } catch {
            // Skip this author if not found
            continue
          }
        }
      }
      
      return doc
    } catch (error) {
      console.error('Error in afterRead hook:', error)
      return doc
    }
  },
]
```

## Collections Fixed

### JobAds
- **Issue**: `afterRead` hook failed when company lookup failed
- **Fix**: Wrapped entire hook in try-catch block
- **File**: `src/collections/JobAds.ts`

### Generations
- **Status**: Already had proper error handling ✅
- **File**: `src/collections/Generations.ts`

### Posts
- **Status**: Already had proper error handling ✅
- **File**: `src/collections/Posts/hooks/populateAuthors.ts`

## Testing

Created comprehensive integration test suite: `tests/integration/delete-operations.test.ts`

**Test Coverage:**
- ✅ Delete with valid relationships
- ✅ Delete with missing relationships
- ✅ Delete with invalid relationship IDs
- ✅ Delete orphaned documents
- ✅ Cascading deletes

**Collections Tested:**
- JobAds
- Generations
- Companies
- Projects
- Experiences
- Certifications
- Educations
- Posts
- Pages
- Resume Profiles

## Running Tests

```bash
# Run all integration tests
pnpm run test:int

# Run only delete operation tests
pnpm run test:int delete-operations

# In Docker
make test
```

## Best Practices Summary

1. **Always wrap async hook logic in try-catch**
2. **Return the document instead of throwing errors**
3. **Log errors for debugging but don't fail the operation**
4. **Check for null/undefined before accessing relationships**
5. **Use optional chaining (`?.`) for nested properties**
6. **Test delete operations with invalid data**

## Related Files

- `src/collections/JobAds.ts` - Fixed afterRead hook
- `src/collections/Generations.ts` - Reference implementation
- `tests/integration/delete-operations.test.ts` - Test suite
- `CHANGELOG.md` - Version history
