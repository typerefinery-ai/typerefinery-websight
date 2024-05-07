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
//namespace
package ai.typerefinery.websight.models.components.layout;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.models.components.BaseComponent;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.jcr.Node;

import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

import lombok.Getter;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { Accordion.RESOURCE_TYPE },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Accordion extends BaseComponent  {

    private static final Logger LOGGER = LoggerFactory.getLogger(Accordion.class);
    
    public static final String RESOURCE_TYPE = "typerefinery/components/layout/accordion";
    public static final String RESOURCE_TYPE_TEMPLATE = "typerefinery/components/layout/template";
    public static final String NODE_TEMPLATE = "template";
  
    @Inject
    @Getter
    @Default(values = "false")
    public Boolean isTemplated;

    @Override
    @PostConstruct
    protected void init() {
        super.init();
        if (isTemplated) {
            //if child node template does not exist, create it
            Resource template = resource.getChild(NODE_TEMPLATE);
            if (template == null) {
                LOGGER.info("Creating template node");
                Node resourceNode = resource.adaptTo(Node.class);
                try {
                    Node templateNode = resourceNode.addNode(NODE_TEMPLATE);
                    templateNode.setProperty("sling:resourceType", RESOURCE_TYPE_TEMPLATE);
                    resourceNode.getSession().save();
                } catch (Exception e) {
                    LOGGER.error("Error creating template node", e);
                }                
            }
        }
        
    }
}