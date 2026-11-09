import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { ServiceProvider } from '@nocobase/service-provider';

export default class SuppliersProvider extends ServiceProvider<Application> {
  public readonly name = 'app/suppliers';

  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: 'suppliers',
      parent: 'business',
      title: { ns: 'app', key: 'suppliers.settings.title' },
    });
    authz.settings.add({
      id: 'suppliers.directory',
      title: { ns: 'app', key: 'suppliers.directory.title' },
      actions: [{ name: 'read' }],
    });
    authz.ui.place(
      { type: 'settings', id: 'suppliers.directory' },
      { section: 'suppliers' },
    );
    authz.settings.add({
      id: 'suppliers.administration',
      title: { ns: 'app', key: 'suppliers.settings.title' },
      actions: [{ name: 'read' }, { name: 'update' }],
    });
    authz.ui.place(
      { type: 'settings', id: 'suppliers.administration' },
      { section: 'suppliers' },
    );
  }
}
