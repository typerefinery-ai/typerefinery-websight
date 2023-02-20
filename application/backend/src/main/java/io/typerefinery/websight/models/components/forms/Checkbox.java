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
package io.typerefinery.websight.models.components.forms;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.models.annotations.Model;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.sling.models.annotations.Default;
import lombok.Getter;

import io.typerefinery.websight.models.components.BaseFormComponent;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Checkbox extends BaseFormComponent {

    protected static final String DEFAULT_LABEL = "Checkbox";
    private static final String DEFAULT_ID = "checkbox";
    private static final String DEFAULT_MODULE = "checkbox";
    
    @Inject
    @Getter
    @Default(values = "false")
    private String value;

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            label = DEFAULT_LABEL;
        }

        if(style != null) {
            style.addClasses("form-check-input");
        }
        
    }

}