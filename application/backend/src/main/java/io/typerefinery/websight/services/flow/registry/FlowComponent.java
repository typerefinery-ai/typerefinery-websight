package io.typerefinery.websight.services.flow.registry;

public interface FlowComponent {
    String getKey();
  
    String getComponent();
    
    int getRanking();
}
