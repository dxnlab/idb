# TODOs

## Common Adds/Puts/Gets/Dels

```typescript
@writes('store')
async addItems({store}, ...its:Item[]) {
    return await store.adds(...its);
}
```
