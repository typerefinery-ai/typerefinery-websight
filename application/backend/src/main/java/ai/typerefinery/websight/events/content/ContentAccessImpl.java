package io.typerefinery.websight.services.content;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.services.ContentAccess;

import java.util.Collections;
import java.util.Map;

@Component(
    immediate = true,
    configurationPolicy = ConfigurationPolicy.IGNORE
)
public class ContentAccessImpl implements ContentAccess {
    
    protected static final Logger LOGGER = LoggerFactory.getLogger(ContentAccessImpl.class);

    private static final String SERVICE_NAME = "content-services";
    private Map<String, Object> AUTH_INFO;

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Activate
    protected void activate() {
        AUTH_INFO = Collections.singletonMap(ResourceResolverFactory.SUBSERVICE, SERVICE_NAME);

        LOGGER.info("activate: resourceResolverFactory={}", resourceResolverFactory);

        try (ResourceResolver resourceResolver = getAdminResourceResolver()) {
            LOGGER.error("activate: resourceResolver={}", resourceResolver);
        } catch (Exception e) {
            LOGGER.error("Could not get resource resolver", e);
        }
        
        LOGGER.error("activate: getSubServiceUser {}", getSubServiceUser());
        LOGGER.error("activate: getBundleServiceUser {}", getBundleServiceUser());
    }

    @Deactivate
    protected void deactivate() {
        LOGGER.info("deactivate: resourceResolverFactory={}", resourceResolverFactory);
    }


    public ResourceResolver getAdminResourceResolver() {

        try {
            return resourceResolverFactory.getServiceResourceResolver(AUTH_INFO);
        } catch (LoginException ex) {
            LOGGER.error("openAdminResourceResolver: Login Exception when getting admin resource resolver, ex={0}", ex);
        } catch (Exception ex) {
            LOGGER.error("openAdminResourceResolver: could not get elevated resource resolver, returning non elevated resource resolver. ex={0}", ex);

        }
        return null;
    }

    /**
     * Example for getting the Bundle SubService User.
     *
     * @return the user ID
     */
    public String getSubServiceUser() {

        // Create the Map to pass in the Service Account Identifier
        // Remember, "SERVICE_ACCOUNT_IDENTIFIER" is mapped  to the CRX User via a SEPARATE ServiceUserMapper Factory OSGi Config
        final Map<String, Object> authInfo = Collections.singletonMap(
                ResourceResolverFactory.SUBSERVICE, SERVICE_NAME);

        // Get the auto-closing Service resource resolver
        try (ResourceResolver serviceResolver = resourceResolverFactory.getServiceResourceResolver(authInfo)) {
            // Do some work w your service resource resolver
            return serviceResolver.getUserID();
        } catch (LoginException ex) {
            LOGGER.error("getSubServiceUser: Login Exception when obtaining a User for the Bundle Service: {}, ex={}", SERVICE_NAME, ex);
        }
        return "";
    }


    /**
     * Example for getting the Bundle Service User
     *
     * @return the user ID
     */
    public String getBundleServiceUser() {

        final Map<String, Object> authInfo = Collections.singletonMap(
            ResourceResolverFactory.SUBSERVICE, SERVICE_NAME);
            
        // Get the auto-closing Service resource resolver
        try (ResourceResolver serviceResolver = resourceResolverFactory.getServiceResourceResolver(authInfo)) {
            // Do some work w your service resource resolver
            return serviceResolver.getUserID();
        } catch (LoginException ex) {
            LOGGER.error("getBundleServiceUser: Login Exception when obtaining a User for the Bundle Service ex={0}", ex);
        }
        return "";
    }
}
