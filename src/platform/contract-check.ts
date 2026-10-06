import * as api from './api';
import type { PlatformApi } from '../lib/platform/contract';
// Compile-time check that the real backend implements every UI method and return type.
const checked: PlatformApi = api;
export default checked;
