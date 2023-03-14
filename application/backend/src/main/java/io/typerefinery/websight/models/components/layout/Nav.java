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

package io.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;

import lombok.Getter;

@Component
@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { 
        Nav.RESOURCE_TYPE 
    }, 
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Nav extends Container {

    
    public static final String RESOURCE_TYPE = "typerefinery/components/layout/nav";

    
    @Inject
    @Getter
    public String backgroundColor;

    public Map<String, String> backgroundColorConfig = new HashMap<String, String>() {
        {
            put("primary", "bg-primary");
            put("secondary", "bg-secondary");
            put("light", "bg-light");
            put("dark", "bg-dark");
            put("default", "");
        }
    };


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        String backgroundColorClass = "";

        if(StringUtils.isNotBlank(backgroundColor)) {
            backgroundColorClass = backgroundColorConfig.getOrDefault(backgroundColor, backgroundColor);
        }

        if(StringUtils.isNotBlank(backgroundColorClass)) {
            grid.addClasses(backgroundColorClass);
        }
        // Default nav class
        grid.addClasses("nav");
    }
}