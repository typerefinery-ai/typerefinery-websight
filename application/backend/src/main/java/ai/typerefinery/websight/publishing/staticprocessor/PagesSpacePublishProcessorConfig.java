package ai.typerefinery.websight.publishing.staticprocessor;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition(name = "Page Space Publish Processor Config")
@interface PagesSpacePublishProcessorConfig {
  @AttributeDefinition(name = "Shorten content paths", description = "Shorten paths to not start with '/content/<space name>/pages' or '/content/<space name>'. Shortening is unaware of the context, therefore replacing all string occurrences.")
  boolean shorten_paths() default false;
}
