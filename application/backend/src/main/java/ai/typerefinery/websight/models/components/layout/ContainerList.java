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

import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.ObjectUtils.Null;
import org.apache.sling.api.SlingHttpServletRequest;
 import org.apache.sling.api.resource.Resource;
 import org.apache.sling.models.annotations.Exporter;
 import org.apache.sling.models.annotations.ExporterOption;
 import org.apache.sling.models.annotations.Model;
 import org.osgi.service.component.annotations.Component;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.layout.Container;
import ai.typerefinery.websight.utils.PageUtil;

import org.slf4j.Logger;
 import org.slf4j.LoggerFactory;
 import javax.inject.Inject;
import javax.inject.Named;

import lombok.Getter;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import ai.typerefinery.websight.utils.PageUtil;
 
 @Component
 @Model(
     adaptables = {
         Resource.class,
         SlingHttpServletRequest.class
     },
     resourceType = { 
        "typerefinery/components/layout/containerlist"
     }, 
     defaultInjectionStrategy = OPTIONAL
 )
 
 @Exporter(name = "jackson", extensions = "json", options = {
         @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
         @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
 })
 public class ContainerList extends BaseComponent{
    private static final Logger LOGGER = LoggerFactory.getLogger(ContainerList.class);
    
    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    public String path;
    // public String resourcePath; // full path of the component
    // public String currentPagePath; // path of the page the component is on

    @Getter
    @Inject
    @NotNull Iterable<Resource> listOfContainer;

    @Getter
    @Inject
    List<String> results
    // Resource parent = resource.getParent();
    // @Getter
    // protected String parent = getParent(); 
    // @Getter
    // private List<String> containerList
   
     @Override
     @PostConstruct
     protected void init() {
         super.init();
         if (StringUtils.isBlank(path)) {
            Resource parent = resource.getParent();
            String parentName=parent.getPath();
            System.out.println(parent.getPath());
            // if(parent != null){
            //     this.listOfContainer=parent.getChildren();
            //         for (Resource resource : this.listOfContainer) {
            //             String data=
            //           } 

            // }
            // resourcePath.getParent()
            // PageUtil.getResourceParentByResourceType(resource,"typerefinery/components/layout/container")
            // this.resourcePath = resource.getPath();
            
            // this.currentPagePath = PageUtil.getResourcePagePath(resource);
        }
     }

   
 }