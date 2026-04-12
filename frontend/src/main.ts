import { platformBrowser } from '@angular/platform-browser';
import * as bootstrap from 'bootstrap';
import DataTable from 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';

/** Modales de DataTables Responsive (columnas colapsadas en móvil). Ver https://datatables.net/ */
DataTable.use(bootstrap as never, 'bootstrap');

import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
