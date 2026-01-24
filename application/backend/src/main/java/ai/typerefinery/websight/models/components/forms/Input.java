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
package ai.typerefinery.websight.models.components.forms;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;


import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import ai.typerefinery.websight.models.components.BaseFormComponent;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

import org.apache.sling.api.SlingHttpServletRequest;
import pl.ds.websight.pages.foundation.WcmMode;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Input extends BaseFormComponent {

    protected static final String DEFAULT_ID = "input";
    protected static final String DEFAULT_MODULE = "input";
    protected static final String DEFAULT_LABEL = "Full Name";
    protected static final String DEFAULT_PLACEHOLDER = "Type here.";

    @Inject
    @Getter
    @Default(values = "text")
    public String inputType;

    @Inject
    @Getter
    @Default(booleanValues = false)
    public Boolean validationRequired;

    
    @Inject
    @Getter
    public String validationInputMask;

    @Inject
    @Getter
    @Default(intValues = 0)
    public Integer rangeMin;

    @Inject
    @Getter
    @Default(intValues = 100)
    public Integer rangeMax;

    @Inject
    @Getter
    @Default(intValues = 1)
    public Integer rangeStep;

    @Inject
    @Getter
    @Default(intValues = 5)
    public Integer ratingMaxStars;

    @Inject
    @Getter
    @Default(booleanValues = true)
    public Boolean ratingAllowHalf;

    @Inject
    @Getter
    @Default(values = "fas fa-star")
    public String ratingIconClass;

    @Inject
    @Getter
    @Default(values = "far fa-star")
    public String ratingIconClassEmpty;

    @Inject
    @Getter
    @Default(values = "fas fa-star-half-alt")
    public String ratingIconClassHalf;

    @Inject
    @Getter
    @Default(values = "#ffc107")
    public String ratingIconColor;

    @Inject
    @Getter
    public String dateOutputFormat;

    @Inject
    @Getter
    public String dateCustomFormat;

    @Inject
    @Getter
    public String dateTimezone;

    @Inject
    @Getter
    public String dateTimezoneCustom;

    @Inject
    @Getter
    public String dateOutputTimezone;

    @SlingObject
    private SlingHttpServletRequest request;

    /**
     * Computed: HTML type attribute value.
     * Maps inputType to HTML type with special handling for hidden (edit mode) and colourpicker.
     */
    @Getter
    private String typeAttr;

    /**
     * Computed: HTML value attribute.
     * Sets default value for colourpicker if no value provided.
     */
    @Getter
    private String valueAttr;

    /**
     * Computed: Whether inputmask should be applied.
     * Excludes colourpicker, range, and rating types.
     */
    @Getter
    private Boolean shouldMask;

    /**
     * Computed: HTML placeholder attribute value (null for rating).
     */
    @Getter
    private String placeholderAttr;

    /**
     * Computed: HTML required attribute value (null for rating).
     */
    @Getter
    private Boolean requiredAttr;

    /**
     * Computed: HTML min attribute value (null if not range).
     */
    @Getter
    private Integer minAttr;

    /**
     * Computed: HTML max attribute value (null if not range).
     */
    @Getter
    private Integer maxAttr;

    /**
     * Computed: HTML step attribute value (null if not range).
     */
    @Getter
    private Integer stepAttr;

    /**
     * Computed: HTML data-inputmask attribute value (null if shouldMask is false).
     */
    @Getter
    private String inputmaskAttr;

    /**
     * Computed: HTML disabled attribute value (null if not disabled).
     */
    @Getter
    private Boolean disabledAttr;

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            this.label = DEFAULT_LABEL;
        }

        if (StringUtils.isBlank(placeholder)) {
            this.placeholder = DEFAULT_PLACEHOLDER;
        }

        // Set base classes based on input type
        if ("range".equals(inputType)) {
            style.addClasses("form-range");
        } else if ("colourpicker".equals(inputType)) {
            style.addClasses("form-control form-control-color");
        } else {
            style.addClasses("form-control mt-1");
        }

        // Compute HTML type attribute value
        boolean isEditMode = request != null && WcmMode.isEdit(request);
        if (isEditMode && "hidden".equals(inputType)) {
            this.typeAttr = "text";
        } else if ("colourpicker".equals(inputType)) {
            this.typeAttr = "color";
        } else {
            this.typeAttr = inputType != null ? inputType : "text";
        }

        // Compute HTML value attribute with default for colourpicker
        if (StringUtils.isNotBlank(value)) {
            this.valueAttr = value;
        } else if ("colourpicker".equals(inputType)) {
            this.valueAttr = "#000000";
        } else {
            this.valueAttr = "";
        }

        // Compute whether inputmask should be applied
        this.shouldMask = !"colourpicker".equals(inputType) 
            && !"range".equals(inputType) 
            && !"rating".equals(inputType) 
            && StringUtils.isNotBlank(validationInputMask);

        // Compute placeholder attribute (null for rating)
        this.placeholderAttr = !"rating".equals(inputType) ? placeholder : null;

        // Compute required attribute (null for rating)
        this.requiredAttr = !"rating".equals(inputType) && Boolean.TRUE.equals(validationRequired) ? true : null;

        // Compute range attributes (null if not range type)
        if ("range".equals(inputType)) {
            this.minAttr = rangeMin != null ? rangeMin : 0;
            this.maxAttr = rangeMax != null ? rangeMax : 100;
            this.stepAttr = rangeStep != null ? rangeStep : 1;
        } else {
            this.minAttr = null;
            this.maxAttr = null;
            this.stepAttr = null;
        }

        // Compute inputmask attribute (null if shouldMask is false)
        this.inputmaskAttr = shouldMask ? validationInputMask : null;

        // Compute disabled attribute (null if not disabled)
        this.disabledAttr = Boolean.TRUE.equals(disabled) ? true : null;
    }

}