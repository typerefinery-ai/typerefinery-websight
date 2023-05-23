package ai.typerefinery.websight.utils;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.function.Function;
import org.apache.sling.api.resource.Resource;
import pl.ds.websight.pages.core.api.Page;

public class DeepIterator<T> implements Iterator<T> {
  final Deque<ResourceIteratorWithLevel<T>> stack;
  
  final int maxLevel;
  
  final Function<T, Iterator<T>> flatteningFunction;
  
  T current;
  
  public static DeepIterator<Page> ofPage(Page page, int maxLevel) {
    return new DeepIterator<>(page, maxLevel, p -> p.streamOfChildren().iterator());
  }
  
  public static DeepIterator<Resource> ofResource(Resource page, int maxLevel) {
    return new DeepIterator<>(page, maxLevel, Resource::listChildren);
  }
  
  public DeepIterator(T resource, int maxLevel, Function<T, Iterator<T>> flatteningFunction) {
    this.maxLevel = maxLevel;
    this.stack = (maxLevel == Integer.MAX_VALUE) ? new ArrayDeque<>() : new ArrayDeque<>(maxLevel);
    this.flatteningFunction = flatteningFunction;
    this.stack.push(ResourceIteratorWithLevel.zerothLevel(flatteningFunction.apply(resource)));
    this.current = seek();
  }
  
  private T seek() {
    while (!this.stack.isEmpty()) {
      ResourceIteratorWithLevel<T> resources = this.stack.peek();
      if (resources.iterator.hasNext() && this.maxLevel > resources.level) {
        T res = resources.iterator.next();
        this.stack.push(resources.nextLevel(this.flatteningFunction.apply(res)));
        return res;
      } 
      this.stack.pop();
    } 
    return null;
  }
  
  public boolean hasNext() {
    return (this.current != null);
  }
  
  public T next() {
    T resource = this.current;
    this.current = seek();
    return resource;
  }
  
  private static class ResourceIteratorWithLevel<T> {
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
}
