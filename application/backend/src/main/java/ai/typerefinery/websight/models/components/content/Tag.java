package ai.typerefinery.websight.models.components.content;


import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Default;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import ai.typerefinery.websight.models.components.BaseFormComponent;
import lombok.Getter;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class Tag extends BaseFormComponent {
    @SlingObject
    private ResourceResolver resourceResolver;


    protected static final String DEFAULT_ID = "tag";
    protected static final String DEFAULT_MODULE = "tag";
    protected static final String DEFAULT_LABEL = "label";

    @Inject
    @Getter
    @Default(values = "")
    private String tagType;


    private Map<String, String> tagTypeConfig = new HashMap<String, String>() {
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
      }
  };


    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;

        super.init();

        if (StringUtils.isBlank(this.label)) {
            this.label = DEFAULT_LABEL;
        }

        if (grid != null && style != null) {
            String tagCls = "badge";
            if (StringUtils.isNotBlank(tagType)) {
                tagCls += " bg";

                tagCls += tagTypeConfig.get(tagType);
            } else {
                tagCls += " bg-primary";
            }

            style.addClasses(tagCls);
        }
    }

    
}
