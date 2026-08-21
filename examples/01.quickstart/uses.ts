/**
 * 
 */
import { IDBStore } from "./idbStore";
import items from './samples';

// use of singular connector
const connector = await IDBStore.get();

// add items ...items
await connector.addItems(...items);

// retrieve all items
const all = connector.getAllItems();

// find one
const first = connector.findItem(1);

// edit the item info
connector.editItem(1, { type: 'found' });
