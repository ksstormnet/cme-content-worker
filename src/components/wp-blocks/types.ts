/**
 * WordPress Blocks TypeScript Definitions
 * Generated: 2025-09-21T19:16:07.868Z
 */

// IconBlock Interface
interface IconBlockProps {
  className?: string;
  children?: React.ReactNode;
  iconLayers?: any[];
  justification?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  ariaLabel?: string;
}

// LegacyWidgetBlock Interface
interface LegacyWidgetBlockProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  idBase?: string;
  instance?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// WidgetGroupBlock Interface
interface WidgetGroupBlockProps {
  className?: string;
  children?: React.ReactNode;
  title?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ArchivesBlock Interface
interface ArchivesBlockProps {
  className?: string;
  children?: React.ReactNode;
  displayAsDropdown?: boolean;
  showLabel?: boolean;
  showPostCounts?: boolean;
  type?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// AvatarBlock Interface
interface AvatarBlockProps {
  className?: string;
  children?: React.ReactNode;
  userId?: number;
  size?: number;
  isLink?: boolean;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  borderColor?: string;
}

// BlockBlock Interface
interface BlockBlockProps {
  className?: string;
  children?: React.ReactNode;
  ref?: number;
  content?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ButtonBlock Interface
interface ButtonBlockProps {
  className?: string;
  children?: React.ReactNode;
  tagName?: string;
  type?: string;
  textAlign?: string;
  url?: string;
  title?: string;
  text?: any;
  linkTarget?: string;
  rel?: string;
  placeholder?: string;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  width?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CalendarBlock Interface
interface CalendarBlockProps {
  className?: string;
  children?: React.ReactNode;
  month?: number;
  year?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
}

// CategoriesBlock Interface
interface CategoriesBlockProps {
  className?: string;
  children?: React.ReactNode;
  taxonomy?: string;
  displayAsDropdown?: boolean;
  showHierarchy?: boolean;
  showPostCounts?: boolean;
  showOnlyTopLevel?: boolean;
  showEmpty?: boolean;
  label?: string;
  showLabel?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentAuthorNameBlock Interface
interface CommentAuthorNameBlockProps {
  className?: string;
  children?: React.ReactNode;
  isLink?: boolean;
  linkTarget?: string;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentContentBlock Interface
interface CommentContentBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentDateBlock Interface
interface CommentDateBlockProps {
  className?: string;
  children?: React.ReactNode;
  format?: string;
  isLink?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentEditLinkBlock Interface
interface CommentEditLinkBlockProps {
  className?: string;
  children?: React.ReactNode;
  linkTarget?: string;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentReplyLinkBlock Interface
interface CommentReplyLinkBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentTemplateBlock Interface
interface CommentTemplateBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentsBlock Interface
interface CommentsBlockProps {
  className?: string;
  children?: React.ReactNode;
  tagName?: string;
  legacy?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CommentsPaginationBlock Interface
interface CommentsPaginationBlockProps {
  className?: string;
  children?: React.ReactNode;
  paginationArrow?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  layout?: Record<string, any>;
}

// CommentsPaginationNextBlock Interface
interface CommentsPaginationNextBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// CommentsPaginationNumbersBlock Interface
interface CommentsPaginationNumbersBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// CommentsPaginationPreviousBlock Interface
interface CommentsPaginationPreviousBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// CommentsTitleBlock Interface
interface CommentsTitleBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  showPostTitle?: boolean;
  showCommentsCount?: boolean;
  level?: number;
  levelOptions?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// CoverBlock Interface
interface CoverBlockProps {
  className?: string;
  children?: React.ReactNode;
  url?: string;
  useFeaturedImage?: boolean;
  id?: number;
  alt?: string;
  hasParallax?: boolean;
  isRepeated?: boolean;
  dimRatio?: number;
  overlayColor?: string;
  customOverlayColor?: string;
  isUserOverlayColor?: boolean;
  backgroundType?: string;
  focalPoint?: Record<string, any>;
  minHeight?: number;
  minHeightUnit?: string;
  gradient?: string;
  customGradient?: string;
  contentPosition?: string;
  isDark?: boolean;
  allowedBlocks?: any[];
  templateLock?: any;
  tagName?: string;
  sizeSlug?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// FileBlock Interface
interface FileBlockProps {
  className?: string;
  children?: React.ReactNode;
  id?: number;
  blob?: string;
  href?: string;
  fileId?: string;
  fileName?: any;
  textLinkHref?: string;
  textLinkTarget?: string;
  showDownloadButton?: boolean;
  downloadButtonText?: any;
  displayPreview?: boolean;
  previewHeight?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  borderColor?: string;
}

// FootnotesBlock Interface
interface FootnotesBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// GalleryBlock Interface
interface GalleryBlockProps {
  className?: string;
  children?: React.ReactNode;
  images?: any[];
  ids?: any[];
  shortCodeTransforms?: any[];
  columns?: number;
  caption?: any;
  imageCrop?: boolean;
  randomOrder?: boolean;
  fixedHeight?: boolean;
  linkTarget?: string;
  linkTo?: string;
  sizeSlug?: string;
  allowResize?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// HeadingBlock Interface
interface HeadingBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  content?: any;
  level?: number;
  levelOptions?: any[];
  placeholder?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// HomeLinkBlock Interface
interface HomeLinkBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  fontSize?: string;
  fontFamily?: string;
}

// ImageBlock Interface
interface ImageBlockProps {
  className?: string;
  children?: React.ReactNode;
  blob?: string;
  url?: string;
  alt?: string;
  caption?: any;
  lightbox?: Record<string, any>;
  title?: string;
  href?: string;
  rel?: string;
  linkClass?: string;
  id?: number;
  width?: string;
  height?: string;
  aspectRatio?: string;
  scale?: string;
  sizeSlug?: string;
  linkDestination?: string;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  borderColor?: string;
}

// LatestCommentsBlock Interface
interface LatestCommentsBlockProps {
  className?: string;
  children?: React.ReactNode;
  commentsToShow?: number;
  displayAvatar?: boolean;
  displayDate?: boolean;
  displayExcerpt?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// LatestPostsBlock Interface
interface LatestPostsBlockProps {
  className?: string;
  children?: React.ReactNode;
  categories?: any[];
  selectedAuthor?: number;
  postsToShow?: number;
  displayPostContent?: boolean;
  displayPostContentRadio?: string;
  excerptLength?: number;
  displayAuthor?: boolean;
  displayPostDate?: boolean;
  postLayout?: string;
  columns?: number;
  order?: string;
  orderBy?: string;
  displayFeaturedImage?: boolean;
  featuredImageAlign?: string;
  featuredImageSizeSlug?: string;
  featuredImageSizeWidth?: number;
  featuredImageSizeHeight?: number;
  addLinkToFeaturedImage?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// ListBlock Interface
interface ListBlockProps {
  className?: string;
  children?: React.ReactNode;
  ordered?: boolean;
  values?: string;
  type?: string;
  start?: number;
  reversed?: boolean;
  placeholder?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// LoginoutBlock Interface
interface LoginoutBlockProps {
  className?: string;
  children?: React.ReactNode;
  displayLoginAsForm?: boolean;
  redirectToCurrent?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// MediaTextBlock Interface
interface MediaTextBlockProps {
  className?: string;
  children?: React.ReactNode;
  align?: string;
  mediaAlt?: string;
  mediaPosition?: string;
  mediaId?: number;
  mediaUrl?: string;
  mediaLink?: string;
  linkDestination?: string;
  linkTarget?: string;
  href?: string;
  rel?: string;
  linkClass?: string;
  mediaType?: string;
  mediaWidth?: number;
  mediaSizeSlug?: string;
  isStackedOnMobile?: boolean;
  verticalAlignment?: string;
  imageFill?: boolean;
  focalPoint?: Record<string, any>;
  allowedBlocks?: any[];
  useFeaturedImage?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// NavigationBlock Interface
interface NavigationBlockProps {
  className?: string;
  children?: React.ReactNode;
  ref?: number;
  textColor?: string;
  customTextColor?: string;
  rgbTextColor?: string;
  backgroundColor?: string;
  customBackgroundColor?: string;
  rgbBackgroundColor?: string;
  showSubmenuIcon?: boolean;
  openSubmenusOnClick?: boolean;
  overlayMenu?: string;
  icon?: string;
  hasIcon?: boolean;
  __unstableLocation?: string;
  overlayBackgroundColor?: string;
  customOverlayBackgroundColor?: string;
  overlayTextColor?: string;
  customOverlayTextColor?: string;
  maxNestingLevel?: number;
  templateLock?: any;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  fontSize?: string;
  fontFamily?: string;
  layout?: Record<string, any>;
  ariaLabel?: string;
}

// NavigationLinkBlock Interface
interface NavigationLinkBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  type?: string;
  description?: string;
  rel?: string;
  id?: number;
  opensInNewTab?: boolean;
  url?: string;
  title?: string;
  kind?: string;
  isTopLevelLink?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  fontSize?: string;
  fontFamily?: string;
}

// NavigationSubmenuBlock Interface
interface NavigationSubmenuBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  type?: string;
  description?: string;
  rel?: string;
  id?: number;
  opensInNewTab?: boolean;
  url?: string;
  title?: string;
  kind?: string;
  isTopLevelItem?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  fontSize?: string;
  fontFamily?: string;
}

// PageListBlock Interface
interface PageListBlockProps {
  className?: string;
  children?: React.ReactNode;
  parentPageID?: number;
  isNested?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PageListItemBlock Interface
interface PageListItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  id?: number;
  label?: string;
  title?: string;
  link?: string;
  hasChildren?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// PatternBlock Interface
interface PatternBlockProps {
  className?: string;
  children?: React.ReactNode;
  slug?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// PostAuthorBlock Interface
interface PostAuthorBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  avatarSize?: number;
  showAvatar?: boolean;
  showBio?: boolean;
  byline?: string;
  isLink?: boolean;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PostAuthorBiographyBlock Interface
interface PostAuthorBiographyBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PostAuthorNameBlock Interface
interface PostAuthorNameBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  isLink?: boolean;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PostCommentsFormBlock Interface
interface PostCommentsFormBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  borderColor?: string;
}

// PostContentBlock Interface
interface PostContentBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// PostDateBlock Interface
interface PostDateBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  format?: string;
  isLink?: boolean;
  displayType?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PostExcerptBlock Interface
interface PostExcerptBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  moreText?: string;
  showMoreOnNewLine?: boolean;
  excerptLength?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PostFeaturedImageBlock Interface
interface PostFeaturedImageBlockProps {
  className?: string;
  children?: React.ReactNode;
  isLink?: boolean;
  aspectRatio?: string;
  width?: string;
  height?: string;
  scale?: string;
  sizeSlug?: string;
  rel?: string;
  linkTarget?: string;
  overlayColor?: string;
  customOverlayColor?: string;
  dimRatio?: number;
  gradient?: string;
  customGradient?: string;
  useFirstImageFromPost?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  borderColor?: string;
}

// PostNavigationLinkBlock Interface
interface PostNavigationLinkBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  type?: string;
  label?: string;
  showTitle?: boolean;
  linkLabel?: boolean;
  arrow?: string;
  taxonomy?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
}

// PostTemplateBlock Interface
interface PostTemplateBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// PostTermsBlock Interface
interface PostTermsBlockProps {
  className?: string;
  children?: React.ReactNode;
  term?: string;
  textAlign?: string;
  separator?: string;
  prefix?: string;
  suffix?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PostTitleBlock Interface
interface PostTitleBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  level?: number;
  levelOptions?: any[];
  isLink?: boolean;
  rel?: string;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// QueryBlock Interface
interface QueryBlockProps {
  className?: string;
  children?: React.ReactNode;
  queryId?: number;
  query?: Record<string, any>;
  tagName?: string;
  namespace?: string;
  enhancedPagination?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  layout?: Record<string, any>;
}

// QueryNoResultsBlock Interface
interface QueryNoResultsBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// QueryPaginationBlock Interface
interface QueryPaginationBlockProps {
  className?: string;
  children?: React.ReactNode;
  paginationArrow?: string;
  showLabel?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  layout?: Record<string, any>;
}

// QueryPaginationNextBlock Interface
interface QueryPaginationNextBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// QueryPaginationNumbersBlock Interface
interface QueryPaginationNumbersBlockProps {
  className?: string;
  children?: React.ReactNode;
  midSize?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// QueryPaginationPreviousBlock Interface
interface QueryPaginationPreviousBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// QueryTitleBlock Interface
interface QueryTitleBlockProps {
  className?: string;
  children?: React.ReactNode;
  type?: string;
  textAlign?: string;
  level?: number;
  levelOptions?: any[];
  showPrefix?: boolean;
  showSearchTerm?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// QueryTotalBlock Interface
interface QueryTotalBlockProps {
  className?: string;
  children?: React.ReactNode;
  displayType?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// ReadMoreBlock Interface
interface ReadMoreBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: string;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// RssBlock Interface
interface RssBlockProps {
  className?: string;
  children?: React.ReactNode;
  columns?: number;
  blockLayout?: string;
  feedURL?: string;
  itemsToShow?: number;
  displayExcerpt?: boolean;
  displayAuthor?: boolean;
  displayDate?: boolean;
  excerptLength?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  borderColor?: string;
}

// SearchBlock Interface
interface SearchBlockProps {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  width?: number;
  widthUnit?: string;
  buttonText?: string;
  buttonPosition?: string;
  buttonUseIcon?: boolean;
  query?: Record<string, any>;
  isSearchFieldHidden?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// ShortcodeBlock Interface
interface ShortcodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  text?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// SiteLogoBlock Interface
interface SiteLogoBlockProps {
  className?: string;
  children?: React.ReactNode;
  width?: number;
  isLink?: boolean;
  linkTarget?: string;
  shouldSyncIcon?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
}

// SiteTaglineBlock Interface
interface SiteTaglineBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  level?: number;
  levelOptions?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// SiteTitleBlock Interface
interface SiteTitleBlockProps {
  className?: string;
  children?: React.ReactNode;
  level?: number;
  levelOptions?: any[];
  textAlign?: string;
  isLink?: boolean;
  linkTarget?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// SocialLinkBlock Interface
interface SocialLinkBlockProps {
  className?: string;
  children?: React.ReactNode;
  url?: string;
  service?: string;
  label?: string;
  rel?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TagCloudBlock Interface
interface TagCloudBlockProps {
  className?: string;
  children?: React.ReactNode;
  numberOfTags?: number;
  taxonomy?: string;
  showTagCounts?: boolean;
  smallestFontSize?: string;
  largestFontSize?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  fontFamily?: string;
  borderColor?: string;
}

// TemplatePartBlock Interface
interface TemplatePartBlockProps {
  className?: string;
  children?: React.ReactNode;
  slug?: string;
  theme?: string;
  tagName?: string;
  area?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
}

// TermDescriptionBlock Interface
interface TermDescriptionBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// AudioBlock Interface
interface AudioBlockProps {
  className?: string;
  children?: React.ReactNode;
  blob?: string;
  src?: string;
  caption?: any;
  id?: number;
  autoplay?: boolean;
  loop?: boolean;
  preload?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
}

// ButtonsBlock Interface
interface ButtonsBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// CodeBlock Interface
interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: any;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// ColumnBlock Interface
interface ColumnBlockProps {
  className?: string;
  children?: React.ReactNode;
  verticalAlignment?: string;
  width?: string;
  allowedBlocks?: any[];
  templateLock?: any;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// ColumnsBlock Interface
interface ColumnsBlockProps {
  className?: string;
  children?: React.ReactNode;
  verticalAlignment?: string;
  isStackedOnMobile?: boolean;
  templateLock?: any;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// DetailsBlock Interface
interface DetailsBlockProps {
  className?: string;
  children?: React.ReactNode;
  showContent?: boolean;
  summary?: any;
  name?: string;
  allowedBlocks?: any[];
  placeholder?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// EmbedBlock Interface
interface EmbedBlockProps {
  className?: string;
  children?: React.ReactNode;
  url?: string;
  caption?: any;
  type?: string;
  providerNameSlug?: string;
  allowResponsive?: boolean;
  responsive?: boolean;
  previewable?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
}

// FreeformBlock Interface
interface FreeformBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// GroupBlock Interface
interface GroupBlockProps {
  className?: string;
  children?: React.ReactNode;
  tagName?: string;
  templateLock?: any;
  allowedBlocks?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
  ariaLabel?: string;
}

// HtmlBlock Interface
interface HtmlBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ListItemBlock Interface
interface ListItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  placeholder?: string;
  content?: any;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// MissingBlock Interface
interface MissingBlockProps {
  className?: string;
  children?: React.ReactNode;
  originalName?: string;
  originalUndelimitedContent?: string;
  originalContent?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// MoreBlock Interface
interface MoreBlockProps {
  className?: string;
  children?: React.ReactNode;
  customText?: string;
  noTeaser?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// NextpageBlock Interface
interface NextpageBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ParagraphBlock Interface
interface ParagraphBlockProps {
  className?: string;
  children?: React.ReactNode;
  align?: string;
  content?: any;
  dropCap?: boolean;
  placeholder?: string;
  direction?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PreformattedBlock Interface
interface PreformattedBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: any;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// PullquoteBlock Interface
interface PullquoteBlockProps {
  className?: string;
  children?: React.ReactNode;
  value?: any;
  citation?: any;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// QuoteBlock Interface
interface QuoteBlockProps {
  className?: string;
  children?: React.ReactNode;
  value?: string;
  citation?: any;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// SeparatorBlock Interface
interface SeparatorBlockProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: string;
  tagName?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
}

// SocialLinksBlock Interface
interface SocialLinksBlockProps {
  className?: string;
  children?: React.ReactNode;
  iconColor?: string;
  customIconColor?: string;
  iconColorValue?: string;
  iconBackgroundColor?: string;
  customIconBackgroundColor?: string;
  iconBackgroundColorValue?: string;
  openInNewTab?: boolean;
  showLabels?: boolean;
  size?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  gradient?: string;
  borderColor?: string;
  layout?: Record<string, any>;
}

// SpacerBlock Interface
interface SpacerBlockProps {
  className?: string;
  children?: React.ReactNode;
  height?: string;
  width?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
}

// TableBlock Interface
interface TableBlockProps {
  className?: string;
  children?: React.ReactNode;
  hasFixedLayout?: boolean;
  caption?: any;
  head?: any[];
  body?: any[];
  foot?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// TextColumnsBlock Interface
interface TextColumnsBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: any[];
  columns?: number;
  width?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// VerseBlock Interface
interface VerseBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: any;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
  borderColor?: string;
}

// VideoBlock Interface
interface VideoBlockProps {
  className?: string;
  children?: React.ReactNode;
  autoplay?: boolean;
  caption?: any;
  controls?: boolean;
  id?: number;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
  preload?: string;
  blob?: string;
  src?: string;
  playsInline?: boolean;
  tracks?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
}

// ContainerBlock Interface
interface ContainerBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// GridBlock Interface
interface GridBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// QueryLoopBlock Interface
interface QueryLoopBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ButtonContainerBlock Interface
interface ButtonContainerBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// HeadlineBlock Interface
interface HeadlineBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ButtonBlock Interface
interface ButtonBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ImageBlock Interface
interface ImageBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TextBlock Interface
interface TextBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  content?: any;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  icon?: string;
  iconLocation?: string;
  iconOnly?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ElementBlock Interface
interface ElementBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  align?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// MediaBlock Interface
interface MediaBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  mediaId?: number;
  linkHtmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ShapeBlock Interface
interface ShapeBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  html?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// QueryBlock Interface
interface QueryBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  queryType?: string;
  paginationType?: string;
  query?: Record<string, any>;
  inheritQuery?: boolean;
  showTemplateSelector?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// LooperBlock Interface
interface LooperBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// QueryNoResultsBlock Interface
interface QueryNoResultsBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// QueryPageNumbersBlock Interface
interface QueryPageNumbersBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  midSize?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// LoopItemBlock Interface
interface LoopItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// DynamicContentBlock Interface
interface DynamicContentBlockProps {
  className?: string;
  children?: React.ReactNode;
  contentType?: string;
  excerptLength?: number;
  useThemeMoreLink?: boolean;
  customMoreLink?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// DynamicImageBlock Interface
interface DynamicImageBlockProps {
  className?: string;
  children?: React.ReactNode;
  imageType?: string;
  imageSource?: string;
  customField?: string;
  gpDynamicSourceInSameTerm?: boolean;
  gpDynamicSourceInSameTermTaxonomy?: any;
  imageSize?: string;
  linkTo?: string;
  linkToCustomField?: string;
  imageWidth?: number;
  imageHeight?: number;
  avatarSize?: number;
  avatarRounded?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// MatomoOptOutBlock Interface
interface MatomoOptOutBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// SvgIconBlock Interface
interface SvgIconBlockProps {
  className?: string;
  children?: React.ReactNode;
  svgURL?: string;
  type?: string;
  alignment?: string;
  imageID?: number;
  imageWidth?: number;
  imageHeight?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  imageSizes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
}

// AccordionBlock Interface
interface AccordionBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// AccordionItemBlock Interface
interface AccordionItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  openByDefault?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// AccordionToggleBlock Interface
interface AccordionToggleBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// AccordionToggleIconBlock Interface
interface AccordionToggleIconBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  openIcon?: string;
  closeIcon?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// AccordionContentBlock Interface
interface AccordionContentBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TabsBlock Interface
interface TabsBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  showTemplateSelector?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TabsMenuBlock Interface
interface TabsMenuBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TabMenuItemBlock Interface
interface TabMenuItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  tabItemOpen?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TabItemsBlock Interface
interface TabItemsBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// TabItemBlock Interface
interface TabItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  tagName?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  tabItemOpen?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ClassicMenuBlock Interface
interface ClassicMenuBlockProps {
  className?: string;
  children?: React.ReactNode;
  menu?: string;
  uniqueId?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// ClassicMenuItemBlock Interface
interface ClassicMenuItemBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  styles?: Record<string, any>;
  css?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ClassicSubMenuBlock Interface
interface ClassicSubMenuBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  styles?: Record<string, any>;
  css?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// NavigationBlock Interface
interface NavigationBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  tagName?: string;
  htmlAttributes?: Record<string, any>;
  subMenuType?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// MenuToggleBlock Interface
interface MenuToggleBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  openIcon?: string;
  closeIcon?: string;
  iconLocation?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  htmlAttributes?: Record<string, any>;
  tagName?: string;
  content?: any;
  iconOnly?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// MenuContainerBlock Interface
interface MenuContainerBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  tagName?: string;
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// SiteHeaderBlock Interface
interface SiteHeaderBlockProps {
  className?: string;
  children?: React.ReactNode;
  uniqueId?: string;
  styles?: Record<string, any>;
  css?: string;
  globalClasses?: any[];
  tagName?: string;
  htmlAttributes?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// FaqBlockBlock Interface
interface FaqBlockBlockProps {
  className?: string;
  children?: React.ReactNode;
  faqs?: any[];
  listStyle?: string;
  titleWrapper?: string;
  imageSize?: string;
  showFAQScheme?: boolean;
  showAccordion?: boolean;
  isProActive?: boolean;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  fontFamily?: string;
}

// SitemapBlock Interface
interface SitemapBlockProps {
  className?: string;
  children?: React.ReactNode;
  postTypes?: any[];
  isSiteMapEnabled?: boolean;
  optionsPageUrl?: string;
  fontSize?: string;
  backgroundColor?: string;
  style?: Record<string, any>;
  textColor?: string;
  gradient?: string;
  className?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// FaqBlockV2Block Interface
interface FaqBlockV2BlockProps {
  className?: string;
  children?: React.ReactNode;
  printSchema?: boolean;
  schema?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
  layout?: Record<string, any>;
}

// PostCommentsBlock Interface
interface PostCommentsBlockProps {
  className?: string;
  children?: React.ReactNode;
  textAlign?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  align?: string;
  className?: string;
  style?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  gradient?: string;
  fontSize?: string;
}

// LocalBusinessBlock Interface
interface LocalBusinessBlockProps {
  className?: string;
  children?: React.ReactNode;
  textColor?: string;
  backgroundColor?: string;
  style?: Record<string, any>;
  className?: string;
  fontSize?: string;
  gradient?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// LocalBusinessFieldBlock Interface
interface LocalBusinessFieldBlockProps {
  className?: string;
  children?: React.ReactNode;
  field?: string;
  hideClosedDays?: boolean;
  inline?: boolean;
  external?: boolean;
  textColor?: string;
  backgroundColor?: string;
  style?: Record<string, any>;
  className?: string;
  fontSize?: string;
  gradient?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// BreadcrumbsBlock Interface
interface BreadcrumbsBlockProps {
  className?: string;
  children?: React.ReactNode;
  inlineStyles?: string;
  homeOption?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// HowToBlock Interface
interface HowToBlockProps {
  className?: string;
  children?: React.ReactNode;
  description?: string;
  unorderedList?: boolean;
  estimatedCost?: string;
  durationDays?: string;
  durationHours?: string;
  durationMinutes?: string;
  schema?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// HowToStepBlock Interface
interface HowToStepBlockProps {
  className?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  schema?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// TableOfContentsBlock Interface
interface TableOfContentsBlockProps {
  className?: string;
  children?: React.ReactNode;
  title?: string;
  titleLevel?: string;
  listTag?: string;
  headings?: any[];
  levels?: any[];
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// BlockFilebirdGalleryBlock Interface
interface BlockFilebirdGalleryBlockProps {
  className?: string;
  children?: React.ReactNode;
  selectedFolder?: any[];
  hasCaption?: boolean;
  hasLightbox?: boolean;
  captions?: Record<string, any>;
  imagesRemoved?: any[];
  images?: any[];
  columns?: number;
  isCropped?: boolean;
  linkTo?: string;
  sortBy?: string;
  sortType?: string;
  layout?: string;
  spaceAroundImage?: number;
  imgMinWidth?: number;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Component Library Types
export interface WordPressBlocksLibrary {
  generatepress: Record<string, React.ComponentType<any>>;
  generateblocks: Record<string, React.ComponentType<any>>;
  core: Record<string, React.ComponentType<any>>;
  thirdParty: Record<string, React.ComponentType<any>>;
}

// Block complexity levels
export type BlockComplexity = 'simple' | 'medium' | 'complex';

// Block category information
export interface BlockCategory {
  name: string;
  components: string[];
  complexity: Record<BlockComplexity, number>;
}
