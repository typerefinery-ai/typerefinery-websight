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

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseFormComponent;
import io.typerefinery.websight.utils.GridDisplayType;
import io.typerefinery.websight.utils.GridStyle;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Button extends BaseFormComponent {
    
    private static final String DEFAULT_ID = "button";
    private static final String DEFAULT_MODULE = "button";

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
    private Boolean openInNewTab;

    
    @Inject
    @Getter
    private Boolean isRoundedButton;

    
    @Inject
    @Getter
    private Boolean isRaisedButton;

    
    @Inject
    @Getter
    private Boolean isOutlinedButton;

    
    
    @Inject
    @Getter
    @Default(values = "")
    private String url;


    private Map<String, String> buttonVariantConfig = new HashMap<String, String>(){{
        put("primary", "-primary");
        put("secondary", "-secondary");
        put("success", "-success");
        put("warning", "-warning");
        put("danger", "-danger");
        put("info", "-info");
        put("help", "-help");
        put("light", "-light");
        put("dark", "-dark");
    }};

    private Map<String, String> buttonSizeConfig = new HashMap<String, String>(){{
        put("small", "p-button-sm");
        put("large", "p-button-lg");
    }};

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        // if (StringUtils.isNotBlank(buttonVariant)) {
        //     buttonVariant = buttonVariantConfig.getOrDefault(buttonVariant, "");
        // }
        if (StringUtils.isNotBlank(buttonSize)) {
            buttonSize = buttonSizeConfig.getOrDefault(buttonSize, "");
        } else {
            buttonSize = "p-normal";
        }

        if (grid != null && style != null) {

            // if (BooleanUtils.isTrue(isRoundedButton)) {
            //     style.addClasses("p-button-rounded");
            // }
            // if (BooleanUtils.isTrue(isRaisedButton)) {
            //     style.addClasses("p-button-raised");
            // }
            String buttonCls = "btn";
            if (StringUtils.isNotBlank(buttonVariant)) {
                buttonCls += " btn";
                if (BooleanUtils.isTrue(isOutlinedButton) && buttonVariant != "link") {
                    buttonCls += "-outline";
                }
                buttonCls += buttonVariantConfig.get(buttonVariant);
            }
            

            style.addClasses(buttonCls);
            style.addClasses(buttonSize);
            
            // if (StringUtils.isNotBlank(buttonVariant)) {
            //     style.addClasses(buttonVariant);
            // }            
            
            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

    }

}