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

package ai.typerefinery.websight.models.datasource;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import ai.typerefinery.websight.models.components.KeyValuePair;
import ai.typerefinery.websight.utils.ComponentUtil;
import lombok.Getter;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { KeyValue.RESOURCE_TYPE },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class KeyValue {
    
    public static final String RESOURCE_TYPE = "typerefinery/components/dialog/datasources/keyvalue";
    
    @Getter
    @SlingObject
    private Resource resource;

    @Getter
    private List<KeyValuePair> options = new ArrayList<KeyValuePair>();

    @ValueMapValue
    private String path;

    private Resource component;
    private Resource dialog;

    @PostConstruct
    private void init() {
        if (path == null || path.isEmpty()) {
            return;
        }

        this.dialog = ComponentUtil.getResourceAncestorByResourceType(resource, ComponentUtil.WS_RESOURCE_TYPE_DIALOG);
        if (dialog == null) {
            return;
        }

        this.component = ComponentUtil.getResourceAncestorByResourceType(resource, ComponentUtil.WS_RESOURCE_TYPE_COMPONENT);
        
        ResourceResolver resolver = resource.getResourceResolver();
        Resource sourceResource = null;

        // Resolve path: absolute (starts with /) or relative to component
        if (path.startsWith("/")) {
            // Absolute path
            sourceResource = resolver.getResource(path);
        } else if (component != null) {
            // Relative to component
            sourceResource = resolver.getResource(component, path);
        }

        if (sourceResource != null) {
            // Load all child resources and adapt to KeyValuePair
            for (Resource child : sourceResource.getChildren()) {
                KeyValuePair option = child.adaptTo(KeyValuePair.class);
                if (option != null && option.getKey() != null) {
                    this.options.add(option);
                }
            }
        }
    }
}

