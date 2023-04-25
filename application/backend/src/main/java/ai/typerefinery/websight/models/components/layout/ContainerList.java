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

package ai.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;
import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.layout.ContainerItem;
import ai.typerefinery.websight.utils.PageUtil;
import ai.typerefinery.websight.utils.JsonUtil;
import ai.typerefinery.websight.utils.ComponentUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
@Component
@Model(adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
}, resourceType = {
        "typerefinery/components/layout/containerlist"
}, defaultInjectionStrategy = OPTIONAL)

@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class ContainerList extends BaseComponent {
    private static final Logger LOGGER = LoggerFactory.getLogger(ContainerList.class);

    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    public String path;

    @Getter
    @Inject
    public String listAlignment;

    @Override
    @PostConstruct
    protected void init() {
        super.init();
    }

    public List<ContainerItem> getContainers() {
        List<ContainerItem> listOfContainer = new ArrayList<>();
        // List<ContainerItem> listOfContainer;
        if (StringUtils.isBlank(this.path)) {
            Resource parent = resource.getParent();
            String parentPath = parent.getPath();
            if (parent != null) {
                for (Resource child : resource.getParent().getChildren()) {
                    if (ComponentUtil.getComponentTitle(child).equals("Container")) {
                        ValueMap props = child.getValueMap();
                        String siblingId = props.get("id", String.class);
                        String title = props.get("title",  String.class);
                        if (StringUtils.isEmpty(siblingId)) {
                            continue;
                        }
                        listOfContainer.add(new ContainerItem(siblingId,title));
                    }
                }
                return listOfContainer;
            }            
        }
        else{
            String ChildrenOfSpecificPath= this.path;
            Resource resource = resourceResolver.getResource(ChildrenOfSpecificPath);
            // String data1=resource.getChildren();
            for (Resource child : resource.getChildren()) {
                if (ComponentUtil.getComponentTitle(child).equals("Container")) {
                    ValueMap props = child.getValueMap();
                    String siblingId = props.get("id", String.class);
                    String title = props.get("title",  String.class);
                    if (StringUtils.isEmpty(siblingId)) {
                        continue;
                    }
                    listOfContainer.add(new ContainerItem(siblingId,title));
                }
            }
            return listOfContainer;
        }
        return listOfContainer;
    }
}