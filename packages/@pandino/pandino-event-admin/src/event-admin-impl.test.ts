import { EVENT_TOPIC } from '@pandino/pandino-event-api';
import { EventAdminImpl } from './event-admin-impl';
import { eventFactoryImpl } from './event-factory-impl';
import { EventHandlerRegistrationInfo } from './event-handler-registration-info';

describe('EventAdminImpl', () => {
  let eventAdmin: EventAdminImpl;
  let mockFilterParser = jest.fn();

  beforeEach(() => {
    mockFilterParser.mockClear();
    eventAdmin = new EventAdminImpl(undefined, undefined, mockFilterParser);
  });

  describe('postEvent()', () => {
    it('multiple registrations, single event, single match', async () => {
      const event = eventFactoryImpl('@pandino/event-admin/Test', {
        prop1: 'test',
        two: 2,
      });
      const reg = createRegistration('@pandino/event-admin/Test');
      const reg2 = createRegistration('@pandino/other-bundle/some-topic');

      eventAdmin.getRegistrations().push(reg, reg2);
      eventAdmin.postEvent(event);

      await new Promise((r) => setTimeout(r, 100));

      expect(eventAdmin.getRegistrations().length).toEqual(2);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
      expect(reg.service.handleEvent).toHaveBeenCalledWith({
        topic: '@pandino/event-admin/Test',
        properties: {
          prop1: 'test',
          two: 2,
        },
      });
      expect(reg2.service.handleEvent).toHaveBeenCalledTimes(0);
    });

    it('multiple registrations, single event, multiple match', async () => {
      const event = eventFactoryImpl('@pandino/event-admin/Test', {});
      const reg = createRegistration('@pandino/event-admin/Test');
      const reg2 = createRegistration('@pandino/event-admin*');

      eventAdmin.getRegistrations().push(reg, reg2);
      eventAdmin.postEvent(event);

      await new Promise((r) => setTimeout(r, 100));

      expect(eventAdmin.getRegistrations().length).toEqual(2);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
      expect(reg2.service.handleEvent).toHaveBeenCalledTimes(1);
    });

    it('single registration, multiple topics, single event, single match', async () => {
      const event = eventFactoryImpl('@pandino/event-admin/Test2', {});
      const reg = createRegistration(['@pandino/event-admin/Test1', '@pandino/event-admin/Test2']);

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event);

      await new Promise((r) => setTimeout(r, 100));

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
    });

    it('single registration, multiple topics, single event, no match', async () => {
      const event = eventFactoryImpl('@pandino/event-admin/some-test', {});
      const reg = createRegistration(['@pandino/event-admin/Test1', '@pandino/event-admin/Test2']);

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event);

      await new Promise((r) => setTimeout(r, 100));

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(0);
    });

    it('single registration, multiple topics, multiple events, multiple matches', async () => {
      const event1 = eventFactoryImpl('@pandino/event-admin/Test1', {
        prop1: 'test1',
      });
      const event2 = eventFactoryImpl('@pandino/event-admin/Test2', {
        prop1: 'test2',
      });
      const mock = jest.fn();
      const reg = createRegistration(['@pandino/event-admin/Test1', '@pandino/event-admin/Test2'], mock);

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event1);
      eventAdmin.postEvent(event2);

      await new Promise((r) => setTimeout(r, 100));

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(mock).toHaveBeenCalledTimes(2);
      expect(mock.mock.calls[0][0]).toEqual({
        topic: '@pandino/event-admin/Test1',
        properties: {
          prop1: 'test1',
        },
      });
      expect(mock.mock.calls[1][0]).toEqual({
        topic: '@pandino/event-admin/Test2',
        properties: {
          prop1: 'test2',
        },
      });
    });
  });

  function createRegistration(topic: string | string[], externalMock?: any): EventHandlerRegistrationInfo {
    return {
      [EVENT_TOPIC]: topic,
      service: {
        handleEvent: externalMock || jest.fn(),
      },
      reference: undefined,
    };
  }
});
