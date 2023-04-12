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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import ai.typerefinery.websight.models.components.layout.NavigationItemComponent;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;

import ai.typerefinery.websight.models.components.BaseFormComponent;
import ai.typerefinery.websight.utils.LinkUtil;
import ai.typerefinery.websight.utils.PageUtil;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import lombok.Getter;
import org.apache.sling.models.annotations.Default;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Button extends BaseFormComponent {

    protected static final String DEFAULT_LABEL = "Click me";
    protected static final String DEFAULT_BUTTON_GRID_CLASS = "mb-3";
    protected static final String DEFAULT_BUTTON_STYLE = "primary";

    protected static final String PROPERTY_HIDE_BUTTON_LABEL = "hideButtonLabel";
    public static final String PROPERTY_VARIANT = "variant";
    public static final String DEFAULT_VARIANT_TEMPLATE_NAME = "hamburger";

    @Inject
    @Getter
    @Default(values = "")
    private String buttonStyle;

    @Inject
    @Getter
    @Named(PROPERTY_VARIANT)
    @Nullable
    public String variant;

    @Inject
    @Getter
    @Default(values = "submit")
    private String buttonType;

    @Inject
    @Getter
    @Default(values = "")
    public String target;

    @Inject
    @Getter
    @Default(values = "")
    public String toggleTarget;

    @Inject
    @Getter
    private Boolean navigateToInNewWindow;

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
    private Boolean showTextualElementOfButton;

    @Inject
    @Getter
    @Default(values = "")
    private String actionType;

    @Inject
    @Default(values = "")
    private String actionUrl;

    @Inject
    @Getter
    @Default(values = "")
    private String actionModalTitle;

    @Inject
    @Getter
    @Default(values = "")
    private String toggleTheme;

    @Inject
    @Getter
    @Nullable
    @Named(PROPERTY_HIDE_BUTTON_LABEL)
    private Boolean hideButtonLabel;

    @Inject
    @Getter
    private Boolean hideFooter;

    @Inject
    @Getter
    private Boolean showIcon;

    @Inject
    @Getter
    private String icon;

    @Inject
    private String navigateTo;

    public String getNavigateTo() {
        return LinkUtil.handleLink(navigateTo, resourceResolver);
    }

    @Inject
    @Getter
    private String iconPosition;

    @Inject
    @Getter
    private List<NavigationItemComponent> dropdownItems;

    public String getActionUrl() {
        return LinkUtil.handleLink(actionUrl, resourceResolver);
    }

    private Map<String, String> buttonVariantConfig = new HashMap<String, String>() {
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
        HashMap<String, Object> props = new HashMap<String, Object>() {
            {
            }
        };

        if (StringUtils.isBlank(this.label)) {
            this.label = DEFAULT_LABEL;
        }
        if (StringUtils.isBlank(buttonStyle)) {
            this.buttonStyle = DEFAULT_BUTTON_STYLE;
        }

        if (BooleanUtils.isTrue(hideButtonLabel)) {
            this.label = " ";
        }

        super.init();

        if (StringUtils.isBlank(this.iconPosition)) {
            this.iconPosition = "left";
        }

        if (grid != null && style != null) {
            String buttonCls = "btn";
            if (StringUtils.isNotBlank(buttonStyle)) {
                buttonCls += " btn";
                if (BooleanUtils.isTrue(isOutlinedButton) && !buttonStyle.equals("link")) {
                    buttonCls += "-outline";
                }
                if (BooleanUtils.isTrue(showTextualElementOfButton) && !buttonStyle.equals("link")) {
                    buttonCls += "-text-nowrap";
                }
                buttonCls += buttonVariantConfig.get(buttonStyle);
            }

            style.addClasses(buttonCls);
        }
        // if persistColorWhenThemeSwitches is null then set it to true
        if (persistColorWhenThemeSwitches == null) {
            persistColorWhenThemeSwitches = true;
            props.put("persistColorWhenThemeSwitches", persistColorWhenThemeSwitches);
            PageUtil.updatResourceProperties(resource, props);
        }
    }

}