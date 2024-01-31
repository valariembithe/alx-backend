#!/usr/bin/env python3
''' LRU Cache module'''
from collections import OrderedDict

from base_caching import BaseCaching


class LRUCache(BaseCaching):
    ''' Implements a class that uses LRU for caching'''
    def __init__(self):
        ''' Initializes attributes from parent class'''
        super().__init__()
        self.cache_data = OrderedDict()

    def put(self, key, item):
        '''Implements the least recently used method'''
        if key is None or item is None:
            return
        if key not in self.cache_data:
            if len(self.cache_data) + 1 > BaseCaching.MAX_ITEMS:
                lru_key, _ = self.cache_data.popitem(True)
                print("DISCARD:", lru_key)
            self.cache_data[key] = item
            self.cache_data.move_to_end(key, last=False)
        else:
            self.cache_data[key] = item

    def get(self, key):
        '''Return the value linked to the key popped'''
        if key is not None or key in self.cache_data.keys():
            self.cache_data.move_to_end(key, last=False)
        return self.cache_data.get(key, None)
    