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
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Button extends BaseFormComponent {

    protected static final String DEFAULT_ID = "button";
    protected static final String DEFAULT_MODULE = "button";
    protected static final String DEFAULT_LABEL = "Click here";

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

    private Map < String, String > buttonVariantConfig = new HashMap < String, String > () {
        {
            put("primary", "-primary");
            put("secondary", "-secondary");
            put("success", "-success");
            put("warning", "-warning");
            put("danger", "-danger");
            put("info", "-info");
            put("help", "-help");
            put("light", "-light");
            put("dark", "-dark");
            put("text", "-link");
        }
    };

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;

        if (StringUtils.isBlank(this.label)) {
            this.label = DEFAULT_LABEL;
        }
        super.init();

        if (grid != null && style != null) {
            String buttonCls = "mb-3 btn";
            if (StringUtils.isNotBlank(buttonVariant)) {
                buttonCls += " btn";
                if (BooleanUtils.isTrue(isOutlinedButton) && buttonVariant != "link") {
                    buttonCls += "-outline";
                }
                buttonCls += buttonVariantConfig.get(buttonVariant);
            } else {
                buttonCls += " btn-primary";
            }

            style.addClasses(buttonCls);
        }
    }

}