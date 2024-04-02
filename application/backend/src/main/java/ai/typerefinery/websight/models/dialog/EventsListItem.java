/*
 * Copyright (C) 2023 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 package ai.typerefinery.websight.models.dialog;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ChildResource;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.models.components.KeyValue;
import ai.typerefinery.websight.models.components.KeyValuePair;
import ai.typerefinery.websight.utils.ComponentUtil;
import lombok.Getter;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class EventsListItem {

    private static final Logger LOGGER = LoggerFactory.getLogger(EventsListItem.class);

    @Getter
    @ValueMapValue
    private String action;

    @Getter
    @ValueMapValue
    private String topic;

    @Getter
    @ValueMapValue
    private String name;
    
    @Getter
    @ValueMapValue
    private String nameCustom;

    @Getter
    @ValueMapValue
    private String type;


    @PostConstruct
    protected void init() {
        LOGGER.info("EventsListItem init()");
    }


}