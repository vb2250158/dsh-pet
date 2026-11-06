/** Build the DSH Host and Web client using the same options as the full release. */
import configurations from './tsdown.config.mjs';

export default configurations.filter(({ entry }) => Object.hasOwn(entry, 'client') || Object.hasOwn(entry, 'index'));
