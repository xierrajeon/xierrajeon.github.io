import { cache } from "react";
import * as queries from "./queries";

/**
 * Server-only wrappers that dedupe reads within a single render.
 *
 * The layout, `generateMetadata` and the page body all want the profile, which
 * would otherwise be three round trips per pre-rendered page. `cache()` cannot
 * be used in queries.ts itself because client components import that module for
 * post-mount revalidation, where a permanent cache would defeat the point.
 */
export const getProfile = cache(queries.getProfile);
export const getResumeData = cache(queries.getResumeData);
export const getPublishedProjects = cache(queries.getPublishedProjects);
export const getProjectBySlug = cache(queries.getProjectBySlug);
export const getAllProjectSlugs = cache(queries.getAllProjectSlugs);
