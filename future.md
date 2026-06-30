# TODOs

## Common Adds/Puts/Gets/Dels

```typescript
@writes('store')
async addItems({store}, ...its:Item[]) {
    return await store.adds(...its);
}
```

## Query Parser

```typescript
// equivalence
@reads('store')
async getAllByName({store}, name:string) {
    store.getAll({name:'name'})
}

// range
@reads('store')
async getRangedScore({store}, minScore:number, maxScore?:number) {
    // parse regexp;
    //  ) or ( are OPEN range (the value not included)
    //  ] or [ are CLOSED range (the value IS included)
    //  min: /^(\(\[)\s*(?<min>[^,])\s*/
    //  max: /,\s*(?<max>[.+])\s*(\(\[)/
    store.getAll({score:`[${minScore},${maxScore})`});
}
```

