// Shared utility for media file counting and deduplication
// Used by both MediaLibrary and MediaCategoryTree components

interface MediaFile {
  id: number;
  original_filename: string;
  category_id: number;
}

interface MediaCategory {
  id: number;
  slug: string;
  parent_id?: number;
}

// Helper function to remove size suffixes from filenames
export const getBaseFilename = (filename: string): string => {
  // Remove common WordPress size suffixes like -150x150, -300x200, -scaled, etc.
  return filename.replace(/-(\d+x\d+|scaled|thumbnail|medium|large|full)(\.[^.]+)?$/, '$2');
};

// Helper function to filter out duplicate sized versions
export const filterDuplicates = (files: MediaFile[]): MediaFile[] => {
  const fileGroups = new Map<string, MediaFile[]>();
  
  // Group files by their base filename
  files.forEach(file => {
    const baseFilename = getBaseFilename(file.original_filename);
    if (!fileGroups.has(baseFilename)) {
      fileGroups.set(baseFilename, []);
    }
    fileGroups.get(baseFilename)!.push(file);
  });
  
  // For each group, prefer the unsized version
  const result: MediaFile[] = [];
  fileGroups.forEach(group => {
    if (group.length === 1) {
      // Only one file, keep it
      result.push(group[0]);
    } else {
      // Multiple files, find the one without size suffix
      const unsizedFile = group.find(file => 
        getBaseFilename(file.original_filename) === file.original_filename
      );
      
      if (unsizedFile) {
        // Found unsized version, use it
        result.push(unsizedFile);
      } else {
        // No unsized version, keep the first one
        result.push(group[0]);
      }
    }
  });
  
  return result;
};

// Calculate deduplicated counts per category with hierarchical support
export const calculateMediaCounts = (allMediaFiles: MediaFile[], categories: MediaCategory[]) => {
  const deduplicatedFiles = filterDuplicates(allMediaFiles);
  const directCounts = new Map<number, number>();
  
  // Count files per category (direct files only)
  deduplicatedFiles.forEach(file => {
    const categoryId = file.category_id || 0; // Use 0 for uncategorized
    directCounts.set(categoryId, (directCounts.get(categoryId) || 0) + 1);
  });
  
  // Calculate hierarchical counts (parent includes children)
  const hierarchicalCounts = new Map<number, number>();
  
  const calculateHierarchicalCount = (categoryId: number): number => {
    if (hierarchicalCounts.has(categoryId)) {
      return hierarchicalCounts.get(categoryId)!;
    }
    
    // Start with direct files in this category
    let totalCount = directCounts.get(categoryId) || 0;
    
    // Add files from all child categories
    const children = categories.filter(cat => cat.parent_id === categoryId);
    children.forEach(child => {
      totalCount += calculateHierarchicalCount(child.id);
    });
    
    hierarchicalCounts.set(categoryId, totalCount);
    return totalCount;
  };
  
  // Calculate counts for all categories
  categories.forEach(category => {
    calculateHierarchicalCount(category.id);
  });
  
  // Calculate special totals
  const nonViewableCategory = categories.find(cat => cat.slug === 'non-viewable');
  const totalExcludingNonViewable = deduplicatedFiles.filter(file => {
    return !nonViewableCategory || file.category_id !== nonViewableCategory.id;
  }).length;
  
  return {
    direct: directCounts,
    hierarchical: hierarchicalCounts,
    total: deduplicatedFiles.length,
    totalExcludingNonViewable,
    deduplicatedFiles
  };
};

// Get all descendant category IDs (including the parent itself)
export const getAllDescendantCategoryIds = (categorySlug: string, categories: MediaCategory[]): number[] => {
  const category = categories.find(cat => cat.slug === categorySlug);
  if (!category) return [];
  
  const descendantIds = [category.id];
  
  // Find all categories that have this category as a parent (direct children)
  const directChildren = categories.filter(cat => cat.parent_id === category.id);
  
  // Recursively get all descendants
  directChildren.forEach(child => {
    descendantIds.push(...getAllDescendantCategoryIds(child.slug, categories));
  });
  
  return descendantIds;
};