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
package io.typerefinery.websight.models.components.forms;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;
import java.util.Map;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseFormComponent;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.sling.api.SlingHttpServletRequest;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Field extends BaseFormComponent {

    protected static final String DEFAULT_ID = "field";
    protected static final String DEFAULT_MODULE = "field";

    // authored flex toggle
    @Inject
    @Getter
    private Boolean flexEnabled;

    private Map < String, String > flexConfig = new HashMap < String, String > () {
        {
            put("enabled", "grid row column-gap-2 align-items-center");
            put("default", "row-gap-2");
        }
    };

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        if (grid != null && style != null) {
            grid.addClasses("form-group");
            if (BooleanUtils.isTrue(flexEnabled)) {
                grid.addClasses(flexConfig.getOrDefault("enabled", ""));
            } else {
                grid.addClasses(flexConfig.getOrDefault("default", ""));
            }
            // Default margin gap.
            grid.addClasses("mb-3");
        }
    }

}