package ai.typerefinery.websight.utils;

import java.util.Iterator;

class ResourceIteratorWithLevel<T> {
  private final Iterator<T> iterator;
  
  private final int level;
  
  private static <T> ResourceIteratorWithLevel<T> zerothLevel(Iterator<T> iterator) {
    return new ResourceIteratorWithLevel<>(iterator, 0);
  }
  
  private ResourceIteratorWithLevel(Iterator<T> iterator, int level) {
    this.iterator = iterator;
    this.level = level;
  }
  
  private ResourceIteratorWithLevel<T> nextLevel(Iterator<T> iterator) {
    return new ResourceIteratorWithLevel(iterator, this.level + 1);
  }
}
