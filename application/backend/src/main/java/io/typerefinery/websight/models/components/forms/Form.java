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
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import javax.annotation.PostConstruct;

import java.util.HashMap;
import java.util.Map;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import io.typerefinery.websight.models.components.BaseFormComponent;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Form extends BaseFormComponent {
  @Inject
  @Getter
  private String writeUrl;

  
  @Inject
  @Getter
  private String rowGap;

  @Inject
  @Getter
  private String columnGap;

  @Inject
  @Getter
  private Boolean flexEnabled;

  @Inject
  @Getter
  private String writePayloadType;

  
  @Inject
  @Getter
  private String writeMethod;

  @Inject
  @Getter
  private String readUrl;

  @Inject
  @Getter
  private String readPayloadType;

  
  @Inject
  @Getter
  private String readMethod;

  
  @Inject
  @Getter
  private String verticalAlignment;

  @Inject
  @Getter
  private String horizontalAlignment;
  
  private Map<String, String> flexConfig = new HashMap<String, String>() {
    {
        put("flexEnabled", "grid");
    }
};
private Map<String, String> verticalAlignmentConfig = new HashMap<String, String>() {
    {
        put("start", "align-items-start");
        put("center", "align-items-center");
        put("end", "align-items-end");
    }
};

private Map<String, String> horizontalAlignmentConfig = new HashMap<String, String>() {
    {
        put("start", "justify-content-start");
        put("center", "justify-content-center");
        put("end", "justify-content-end");
        put("space-around", "justify-content-around");
        put("evenly", "justify-content-evenly");
        put("between", "justify-content-between");
    }
};


  private static final String DEFAULT_ID = "form";
  private static final String DEFAULT_MODULE = "formComponent";
    
  @Override
  @PostConstruct
  protected void init() {
      this.id = DEFAULT_ID;
      this.module = DEFAULT_MODULE;
      super.init();
      if (StringUtils.isBlank(columnGap) && StringUtils.isBlank(rowGap)) {
        grid.addClasses("gap-3");
    } else {
        if (StringUtils.isNotBlank(columnGap)) {
            grid.addClasses("column-gap-" + columnGap);
        }
        if (StringUtils.isNotBlank(rowGap)) {
            grid.addClasses("row-gap-" + rowGap);
        }
    }
    if (BooleanUtils.isTrue(flexEnabled)) {
        grid.addClasses(flexConfig.get("flexEnabled"));
    }
    if (StringUtils.isNotBlank(horizontalAlignment)) {
        grid.addClasses(horizontalAlignmentConfig.getOrDefault(horizontalAlignment, ""));
    }
    if (StringUtils.isNotBlank(verticalAlignment)) {
        grid.addClasses(verticalAlignmentConfig.getOrDefault(verticalAlignment, ""));
    }
    grid.addClasses(horizontalAlignmentConfig.get(""));
  }
}