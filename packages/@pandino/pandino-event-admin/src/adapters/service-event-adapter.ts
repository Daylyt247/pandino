import {
  BundleContext,
  OBJECTCLASS,
  SERVICE_ID,
  SERVICE_PID,
  ServiceEvent,
  ServiceListener,
} from '@pandino/pandino-api';
import {
  EVENT,
  EventAdmin,
  SERVICE,
  SERVICE_EVENT_INTERFACE_KEY,
  SERVICE_OBJECTCLASS,
} from '@pandino/pandino-event-api';
import { AbstractAdapter } from './abstract-adapter';
import { eventFactoryImpl } from '../event-factory-impl';

export class ServiceEventAdapter extends AbstractAdapter implements ServiceListener {
  constructor(context: BundleContext, admin: EventAdmin) {
    super(admin);
    context.addServiceListener(this);
  }

  destroy(bundleContext: BundleContext): void {
    bundleContext.removeServiceListener(this);
  }

  serviceChanged(event: ServiceEvent): void {
    let properties: Record<string, any> = {
      [EVENT]: event,
      [SERVICE]: event.getServiceReference(),
      [SERVICE_ID]: event.getServiceReference().getProperty(SERVICE_ID),
      [SERVICE_OBJECTCLASS]: event.getServiceReference().getProperty(OBJECTCLASS),
    };

    const pid = event.getServiceReference().getProperty(SERVICE_PID);
    if (pid) {
      properties[SERVICE_PID] = pid;
    }

    let topic = `${SERVICE_EVENT_INTERFACE_KEY}/`;

    switch (event.getType()) {
      case 'REGISTERED':
        topic += 'REGISTERED';
        break;
      case 'MODIFIED':
        topic += 'MODIFIED';
        break;
      case 'UNREGISTERING':
        topic += 'UNREGISTERING';
        break;
      default:
        return; // IGNORE
    }

    try {
      this.getEventAdmin().postEvent(eventFactoryImpl(topic.toString(), properties));
    } catch (err) {
      // This is o.k. - indicates that we are stopped.
    }
  }
}
