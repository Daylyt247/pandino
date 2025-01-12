import {
  DEPLOYMENT_ROOT_PROP,
  LOG_LEVEL_PROP,
  LOG_LOGGER_PROP,
  PANDINO_ACTIVATOR_RESOLVERS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
} from '../pandino-constants';
import { Logger, LogLevel } from '../logger';
import { ManifestFetcher } from '../manifest-fetcher';
import { BundleImporter } from '../bundle-importer';
import { BundleType } from '../bundle';
import { ActivatorResolver } from '../activator-resolver';

export interface FrameworkConfigMap extends Record<string, any> {
  [PANDINO_MANIFEST_FETCHER_PROP]: ManifestFetcher;
  [PANDINO_BUNDLE_IMPORTER_PROP]: BundleImporter;
  [PANDINO_ACTIVATOR_RESOLVERS]?: Record<BundleType, ActivatorResolver>;
  [DEPLOYMENT_ROOT_PROP]?: string;
  [LOG_LOGGER_PROP]?: Logger;
  [LOG_LEVEL_PROP]?: LogLevel;
}
