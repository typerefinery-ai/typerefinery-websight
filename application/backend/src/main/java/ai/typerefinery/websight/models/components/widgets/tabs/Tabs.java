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

package ai.typerefinery.websight.models.components.widgets.tabs;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.List;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ChildResource;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;
import lombok.Getter;
import org.apache.sling.models.annotations.Default;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Tabs extends BaseComponent {

    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/tabs";

    @Inject
    @ChildResource(name = "tabs")
    public List<TabItem> tabsList;

    @Inject
    @Getter
    public List<KeyValuePair> events;

    
    @Inject
    @Getter
    public String placeholderContent;

    @Inject
    @Getter
    @Default(values = "80vh")
    public String contentHeight;

    @Inject
    public String[] path; //TODO: remove this

    @Getter
    protected Resource inheritedResource;
    
    @OSGiService
    private SlingRequestProcessor requestProcessor;


    @Override
    @PostConstruct
    protected void init() {
        super.init();
    }


}