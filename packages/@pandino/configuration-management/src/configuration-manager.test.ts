import {
  Bundle,
  BundleContext,
  Logger,
  SemverFactory,
  SERVICE_PID,
  ServiceEvent,
  ServiceReference,
} from '@pandino/pandino-api';
import { ManagedService } from '@pandino/configuration-management-api';
import { MockBundleContext } from './__mocks__/mock-bundle-context';
import { MockBundle } from './__mocks__/mock-bundle';
import { MockPersistenceManager } from './__mocks__/mock-persistence-manager';
import { createVersionMock } from './__mocks__/semver';
import { ConfigurationManager } from './configuration-manager';

describe('ConfigurationManager', function () {
  const semverFactory: SemverFactory = {
    build: (version) => createVersionMock(version),
  };
  let persistenceManager: MockPersistenceManager;
  let context: BundleContext;
  let bundle: Bundle;
  let cm: ConfigurationManager;
  let mockFilterParser: any = {
    parse: jest.fn(),
  };
  let mockDebug = jest.fn();
  let logger: Logger = {
    debug: mockDebug,
  } as unknown as Logger;

  beforeEach(() => {
    mockDebug.mockClear();
    context = new MockBundleContext();
    bundle = new MockBundle(
      context as MockBundleContext,
      'test.bundle.location',
      '@test/my-bundle',
      createVersionMock('0.0.0'),
    );
    persistenceManager = new MockPersistenceManager(`{
      "my.component.pid": {
        "service.pid": "my.component.pid",
        "port" : 300
      }
    }`);
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);
  });

  it('listConfigurations()', () => {
    persistenceManager = new MockPersistenceManager(`{
      "my.component.pid": {
        "service.pid": "my.component.pid",
        "port" : 300, 
        "collection" : [2, 3, 4],  
        "complex": { 
          "a" : 1, 
          "b" : "two"
        }
      },
      "my.other.pid": {
        "service.pid": "my.other.pid",
        "key": "value"
      }
    }`);
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    expect(cm.listConfigurations().length).toEqual(2);

    const [config1, config2] = cm.listConfigurations();

    expect(config1.getPid()).toEqual('my.component.pid');
    expect(config1.getProperties()).toEqual({
      collection: [2, 3, 4],
      complex: { a: 1, b: 'two' },
      port: 300,
      'service.pid': 'my.component.pid',
    });

    expect(config2.getPid()).toEqual('my.other.pid');
    expect(config2.getProperties()).toEqual({ key: 'value', 'service.pid': 'my.other.pid' });
  });

  it('listConfigurations() with filter', () => {
    const mockFilter: any = {
      match: jest.fn().mockImplementation((props: any) => props['key'] === 'value'),
    };
    mockFilterParser.parse.mockImplementation((str: string) => mockFilter);
    persistenceManager = new MockPersistenceManager(`{
      "my.component.pid": {
        "service.pid": "my.component.pid",
        "port" : 300, 
        "collection" : [2, 3, 4],  
        "complex": { 
          "a" : 1, 
          "b" : "two"
        }
      },
      "my.other.pid": {
        "service.pid": "my.other.pid",
        "key": "value"
      }
    }`);
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);
    const configurations = cm.listConfigurations('(key=value)');

    expect(configurations.length).toEqual(1);
    expect(mockFilterParser.parse).toHaveBeenCalledTimes(1);
    expect(mockFilterParser.parse).toHaveBeenCalledWith('(key=value)');
    expect(mockFilter.match).toHaveBeenCalledTimes(2);
    expect(mockFilter.match.mock.calls[0][0]).toBeDefined();
    expect(mockFilter.match.mock.calls[1][0]).toEqual({
      'service.pid': 'my.other.pid',
      key: 'value',
    });

    const [config2] = configurations;

    expect(config2.getPid()).toEqual('my.other.pid');
    expect(config2.getProperties()).toEqual({ key: 'value', 'service.pid': 'my.other.pid' });
  });

  it('getConfiguration()', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    const config = cm.getConfiguration('my.component.pid');

    expect(config.getPid()).toEqual('my.component.pid');
    expect(config.getBundleLocation()).toEqual('test.bundle.location');
    expect(persistenceManager.dump()).toMatchSnapshot();
  });

  it('configuration update()', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    const config = cm.getConfiguration('my.component.pid');

    expect(persistenceManager.dump()).toMatchSnapshot();

    config.update({
      ...config.getProperties(),
      'new-prop': 'new-value',
    });

    expect(persistenceManager.dump()).toMatchSnapshot();
  });

  it('configuration delete()', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    const config = cm.getConfiguration('my.component.pid');

    expect(persistenceManager.dump()).toMatchSnapshot();

    config.delete();

    expect(() => config.getPid()).toThrow();
    expect(persistenceManager.dump()).toMatchSnapshot();
  });

  it('serviceChanged for configuration event', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    expect((cm as any).eventListeners.size).toEqual(0);

    const mockService: any = {
      configurationEvent: jest.fn(),
    };
    (context as any).getService = () => mockService;
    const mockServiceReference: any = {
      getProperty: (prop: string) => {
        if (prop === SERVICE_PID) {
          return 'mock.pid';
        }
      },
    };
    const registeredEvent: ServiceEvent = {
      getType: () => 'REGISTERED',
      getServiceReference: () => mockServiceReference,
    };

    cm.serviceChanged(registeredEvent);

    expect((cm as any).eventListeners.size).toEqual(1);
    expect((cm as any).eventListeners.has('mock.pid')).toEqual(true);
    expect((cm as any).eventListeners.get('mock.pid').length).toEqual(1);
    expect((cm as any).eventListeners.get('mock.pid')[0]).toEqual(mockService);

    const unregisteringEvent: ServiceEvent = {
      getType: () => 'UNREGISTERING',
      getServiceReference: () => mockServiceReference,
    };

    cm.serviceChanged(unregisteringEvent);

    expect((cm as any).eventListeners.size).toEqual(1);
    expect((cm as any).eventListeners.has('mock.pid')).toEqual(true);
    expect((cm as any).eventListeners.get('mock.pid').length).toEqual(0);
  });

  it('serviceChanged for managed service event', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    expect((cm as any).managedReferences.size).toEqual(0);

    const mockService: any = {
      updated: jest.fn(),
    };
    (context as any).getService = () => mockService;
    const mockServiceReference: any = {
      getProperty: (prop: string) => {
        if (prop === SERVICE_PID) {
          return 'mock.pid';
        }
      },
      getBundle: () => ({
        getLocation: () => 'test.location.yayy',
      }),
    };
    const registeredEvent: ServiceEvent = {
      getType: () => 'REGISTERED',
      getServiceReference: () => mockServiceReference,
    };

    cm.serviceChanged(registeredEvent);

    expect((cm as any).managedReferences.size).toEqual(1);
    expect((cm as any).managedReferences.has('mock.pid')).toEqual(true);
    expect((cm as any).managedReferences.get('mock.pid').length).toEqual(1);
    expect((cm as any).managedReferences.get('mock.pid')[0]).toEqual(mockServiceReference);

    const unregisteringEvent: ServiceEvent = {
      getType: () => 'UNREGISTERING',
      getServiceReference: () => mockServiceReference,
    };

    cm.serviceChanged(unregisteringEvent);

    expect((cm as any).managedReferences.size).toEqual(1);
    expect((cm as any).managedReferences.has('mock.pid')).toEqual(true);
    expect((cm as any).managedReferences.get('mock.pid').length).toEqual(0);
  });

  describe('initReferencesAddedBeforeManagerActivation', () => {
    it('some references had pre-stored configurations, while others did not', () => {
      persistenceManager = new MockPersistenceManager(`{
        "my.component.pid": {
          "service.pid": "my.component.pid",
          "port" : 300
        }
      }`);
      const refWithInitializedConfig: any = {
        getProperty: (prop: string) => (prop === SERVICE_PID ? 'my.component.pid' : undefined),
        getProperties: () => ({
          [SERVICE_PID]: 'my.component.pid',
          port: 150,
        }),
        getBundle: () => ({
          getLocation: () => 'some.location',
          getSymbolicName: () => '@scope/component-1',
          getVersion: () => createVersionMock('1.2.3'),
        }),
      };
      const refWithOwnConfig: any = {
        getProperty: (prop: string) => (prop === SERVICE_PID ? 'my.other-component.pid' : undefined),
        getProperties: () => ({
          [SERVICE_PID]: 'my.other-component.pid',
          isPowerful: true,
        }),
        getBundle: () => ({
          getLocation: () => 'some.other.location',
          getSymbolicName: () => '@scope/component-2',
          getVersion: () => createVersionMock('1.0.0'),
        }),
      };
      const refWithoutAnyConfig: any = {
        getProperty: () => {},
        getProperties: () => ({
          isPowerful: false,
        }),
        getBundle: () => ({
          getLocation: () => 'yet.other.location',
          getSymbolicName: () => '@scope/component-3',
          getVersion: () => createVersionMock('3.2.1'),
        }),
      };

      const allRefs: any[] = [refWithInitializedConfig, refWithOwnConfig, refWithoutAnyConfig];
      (context as any).getServiceReferences = () => allRefs;

      const serviceForRefWithInitializedConfig: ManagedService = {
        updated: jest.fn(),
      };
      const serviceForRefWithOwnConfig: ManagedService = {
        updated: jest.fn(),
      };
      const serviceToSkip: ManagedService = {
        updated: jest.fn(),
      };

      const allServices: Map<any, ManagedService> = new Map<any, ManagedService>([
        [refWithInitializedConfig, serviceForRefWithInitializedConfig],
        [refWithOwnConfig, serviceForRefWithOwnConfig],
        [refWithoutAnyConfig, serviceToSkip],
      ]);
      (context as any).getService = (ref: any) => allServices.get(ref);
      cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

      expect((cm as any).managedReferences.size).toEqual(0);

      cm.initReferencesAddedBeforeManagerActivation();

      const managedRefs: Map<string, Array<ServiceReference<ManagedService>>> = (cm as any).managedReferences;

      expect(managedRefs.size).toEqual(2);
      expect(managedRefs.get('my.component.pid')).toEqual([refWithInitializedConfig]);
      expect(managedRefs.get('my.other-component.pid')).toEqual([refWithOwnConfig]);

      expect(serviceForRefWithInitializedConfig.updated).toHaveBeenCalledTimes(1);
      expect(serviceForRefWithInitializedConfig.updated).toHaveBeenCalledWith({
        port: 300,
        [SERVICE_PID]: 'my.component.pid',
      });
      expect(serviceForRefWithOwnConfig.updated).toHaveBeenCalledTimes(1);
      expect(serviceForRefWithOwnConfig.updated).toHaveBeenCalledWith(undefined);
      expect(serviceToSkip.updated).toHaveBeenCalledTimes(0);

      expect(mockDebug).toHaveBeenCalledTimes(1);
      expect(mockDebug).toHaveBeenCalledWith('Updating non-configured Service for PID: my.other-component.pid');
    });
  });
});
