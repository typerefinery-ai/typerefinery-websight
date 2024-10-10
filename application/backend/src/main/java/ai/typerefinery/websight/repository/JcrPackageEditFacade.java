package ai.typerefinery.websight.repository;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.fs.api.PathFilterSet;
import org.apache.jackrabbit.vault.fs.api.WorkspaceFilter;
import org.apache.jackrabbit.vault.fs.config.DefaultWorkspaceFilter;
import org.apache.jackrabbit.vault.fs.config.MetaInf;
import org.apache.jackrabbit.vault.fs.io.AccessControlHandling;
import org.apache.jackrabbit.vault.packaging.Dependency;
import org.apache.jackrabbit.vault.packaging.JcrPackage;
import org.apache.jackrabbit.vault.packaging.JcrPackageDefinition;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JcrPackageEditFacade {
  private static final Logger LOG = LoggerFactory.getLogger(JcrPackageEditFacade.class);
   private static final String THUMBNAIL_MIMETYPE = "image/png";
   private final JcrPackageDefinition packageDefinition;

   private JcrPackageEditFacade(JcrPackageDefinition packageDefinition) {
      this.packageDefinition = packageDefinition;
   }

   public static JcrPackageEditFacade forPackage(JcrPackage jcrPackage) {
    return JcrPackageUtil.fetchDefinition(jcrPackage)
      .map(JcrPackageEditFacade::new)
      .orElse(null);
  }

   public void setDescription(String newDescription) {
      String description = this.packageDefinition.getDescription();
      if (!StringUtils.equals(description, newDescription)) {
         this.packageDefinition.set("jcr:description", newDescription, false);
      }

   }

   public void setFilters(List<PathFilterSet> newFilters) throws RepositoryException {
      MetaInf metaInfo = this.packageDefinition.getMetaInf();
      boolean isFilterNotReinitialized = true;
      WorkspaceFilter filter = metaInfo.getFilter();
      String downloadName = this.getPackageDownloadName();
      if (filter == null) {
         LOG.warn("Package {} doesn't contain its own Workspace filter, created new {}", downloadName, DefaultWorkspaceFilter.class.getSimpleName());
         isFilterNotReinitialized = false;
         filter = new DefaultWorkspaceFilter();
      }

      List<PathFilterSet> packageFilters = ((WorkspaceFilter)filter).getFilterSets();
      if (!isFilterNotReinitialized || !this.arePathFilterSetsEqual(packageFilters, newFilters)) {
         packageFilters.clear();
         packageFilters.addAll(newFilters);
         LOG.debug("Setting filters for package {}", downloadName);
         this.packageDefinition.setFilter((WorkspaceFilter)filter, false);
         LOG.debug("Updating last modification date of package {} due to setting filters", downloadName);
         this.updateLastModificationDate();
      }
   }

   private boolean arePathFilterSetsEqual(List<PathFilterSet> list, List<PathFilterSet> compared) {
      if (list.size() != compared.size()) {
         return false;
      } else {
         for(int i = 0; i < list.size(); ++i) {
            PathFilterSet pathFilterSet = (PathFilterSet)list.get(i);
            PathFilterSet comparedPathFilterSet = (PathFilterSet)compared.get(i);
            if (!pathFilterSet.equals(comparedPathFilterSet) || !pathFilterSet.getImportMode().equals(comparedPathFilterSet.getImportMode())) {
               return false;
            }
         }

         return true;
      }
   }

   public void deleteThumbnail() throws RepositoryException {
      Node packageNode = this.packageDefinition.getNode();
      if (!packageNode.hasNode("thumbnail.png")) {
         LOG.debug("No thumbnail to remove for package definition: {}", this.getPackageDefinitionPath());
      } else {
         Session session = this.packageDefinition.getNode().getSession();
         String downloadName = this.getPackageDownloadName();
         LOG.debug("Deleting current thumbnail for package: {}", downloadName);
         session.removeItem(packageNode.getNode("thumbnail.png").getPath());
         LOG.debug("Updating last modification date of package {} due to thumbnail removal", downloadName);
         this.updateLastModificationDate();
      }
   }

   public void setThumbnail(InputStream newThumbnailStream, ResourceResolver resolver) throws RepositoryException, PersistenceException {
      if (newThumbnailStream == null) {
         LOG.warn("New thumbnail inputstream does not contain any data, skipping thumbnail update");
      } else {
         String packageDefPath = this.getPackageDefinitionPath();
         String downloadName = this.getPackageDownloadName();
         LOG.debug("Setting thumbnail for package {}", downloadName);
         Resource thumbnailFileResource = ResourceUtil.getOrCreateResource(resolver, packageDefPath + "/thumbnail.png", Collections.singletonMap("jcr:primaryType", "nt:file"), "nt:unstructured", false);
         Resource thumbnailContent = thumbnailFileResource.getChild("jcr:content");
         if (thumbnailContent != null) {
            resolver.delete(thumbnailContent);
         }

         resolver.create(thumbnailFileResource, "jcr:content", getThumbnailContentProperties(newThumbnailStream));
         LOG.debug("Successfully updated thumbnail for package: {}", downloadName);
         LOG.debug("Updating last modification date of package {} due to thumbnail update", downloadName);
         this.updateLastModificationDate();
      }
   }

   private String getPackageDefinitionPath() throws RepositoryException {
      return this.packageDefinition.getNode().getPath();
   }

   private String getPackageDownloadName() {
      return this.packageDefinition.getId().getDownloadName();
   }

   private static Map<String, Object> getThumbnailContentProperties(InputStream thumbnailStream) {
      Map<String, Object> contentProps = new HashMap();
      contentProps.put("jcr:primaryType", "nt:resource");
      contentProps.put("jcr:mimeType", "image/png");
      contentProps.put("jcr:data", thumbnailStream);
      return contentProps;
   }

   private void updateLastModificationDate() {
      this.packageDefinition.touch((Calendar)null, false);
   }

   public void setDependencies(List<Dependency> newDependencies) {
      List<Dependency> oldDependencies = Arrays.asList(this.packageDefinition.getDependencies());
      if (!oldDependencies.equals(newDependencies)) {
         this.packageDefinition.setDependencies((Dependency[])newDependencies.toArray(new Dependency[0]), false);
      }
   }

   public void setAcHandling(AccessControlHandling newAcHandling) throws RepositoryException {
      AccessControlHandling oldAcHandling = this.packageDefinition.getAccessControlHandling();
      if (!Objects.equals(oldAcHandling, newAcHandling)) {
         if (newAcHandling == null) {
            this.removeAcHandlingProperty();
         } else {
            this.packageDefinition.set("acHandling", newAcHandling.toString().toLowerCase(JcrPackageUtil.DEFAULT_LOCALE), false);
         }

      }
   }

   private void removeAcHandlingProperty() throws RepositoryException {
      Node packageDefinitionNode = this.packageDefinition.getNode();
      Property acHandlingProp = packageDefinitionNode.getProperty("acHandling");
      if (acHandlingProp != null) {
         acHandlingProp.remove();
      }

   }

   public void setRequiresRestart(boolean newRequiredRestart) {
      boolean requiredRestart = this.packageDefinition.requiresRestart();
      if (requiredRestart != newRequiredRestart) {
         this.packageDefinition.set("requiresRestart", newRequiredRestart, false);
      }
   }
}
