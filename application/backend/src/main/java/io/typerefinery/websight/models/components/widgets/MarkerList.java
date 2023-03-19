package io.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)

public class MarkerList {

    @Getter
    @Inject
    private String markerLat;
  
    @Getter
    @Inject
    private String markerLng;
  
    @Getter
    @Inject
    private String popupText;
}


 
 