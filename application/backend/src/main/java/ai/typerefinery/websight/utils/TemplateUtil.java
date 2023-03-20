package ai.typerefinery.websight.utils;

import java.util.Arrays;
import java.util.Collection;

public class TemplateUtil {
  private static final Collection<String> NOT_COPYABLE_TEMPLATE_PROPERTIES = Arrays.asList(new String[] { "jcr:created", "jcr:createdBy", "jcr:lastModified", "jcr:lastModifiedBy" });
  
  public static boolean isCopyableProperty(String propertyName) {
    return !NOT_COPYABLE_TEMPLATE_PROPERTIES.contains(propertyName);
  }
}
