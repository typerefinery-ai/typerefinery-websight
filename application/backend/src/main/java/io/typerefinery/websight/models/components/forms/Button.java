/*
 * Copyright (C) 2022 Typerefinery.io
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

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseFormComponent;
import io.typerefinery.websight.utils.GridDisplayType;
import io.typerefinery.websight.utils.GridStyle;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Button extends BaseFormComponent {

    @Inject
    @Getter
    @Default(values = "false")
    private String value;

    @Inject
    @Getter
    @Default(values = "")
    private String buttonSize;

    @Inject
    @Getter
    @Default(values = "")
    private String buttonVariant;

    
    @Inject
    @Getter
    @Default(values = "")
    private String buttonType;

    
    @Inject
    @Getter
    @Default(values = "")
    private String isRoundedButton;

    
    @Inject
    @Getter
    @Default(values = "")
    private String isRaisedButton;

    
    @Inject
    @Getter
    @Default(values = "")
    private String isOutlinedButton;

    
    
    @Inject
    @Getter
    @Default(values = "")
    private String url;


    private Map<String, String> buttonVariantConfig = new HashMap<String, String>(){{
        put("primary", "p-button");
        put("success", "p-button-success");
        put("warning", "p-button-warning");
        put("danger", "p-button-danger");
    }};

    private Map<String, String> buttonSizeConfig = new HashMap<String, String>(){{
        put("small", "p-button-sm");
        put("large", "p-button-lg");
    }};

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isNotBlank(buttonVariant)) {
            buttonVariant = buttonVariantConfig.getOrDefault(buttonVariant, "");
        }
        if (StringUtils.isNotBlank(buttonSize)) {
            buttonSize = buttonSizeConfig.getOrDefault(buttonSize, "");
        } else {
            buttonSize = "p-normal";
        }

        if (grid != null && style != null) {

            if (Boolean.valueOf(isRoundedButton)) {
                style.addClasses("p-button-rounded");
            }
            if (Boolean.valueOf(isRaisedButton)) {
                style.addClasses("p-button-raised");
            }
            if (Boolean.valueOf(isOutlinedButton)) {
                style.addClasses("p-button-outlined");
            }

            style.addClasses(buttonSize);
            style.addClasses(buttonVariant);
            
            componentClasses = Stream.concat(
                Arrays.stream(style.getClasses()),
                new GridStyle(grid, GridDisplayType.GRID).getClasses().stream())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

    }

}