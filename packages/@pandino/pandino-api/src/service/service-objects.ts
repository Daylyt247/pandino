/**
 * Allows multiple service objects for a service to be obtained.
 * <p>
 * For services with {@link SCOPE_PROTOTYPE prototype} scope, multiple service objects for the service can be obtained.
 * Since implementations of {@link PrototypeServiceFactory} can return the same service object repeatedly, the framework
 * must use count the returned service objects to release the service object only when its use count returns to zero.
 * <p>
 * For services with {@link SCOPE_SINGLETON singleton} or {@link SCOPE_BUNDLE bundle} scope, only one, use-counted
 * service object is available to a requesting bundle.
 * <p>
 * Any unreleased service objects obtained from this {@code ServiceObjects} object are automatically released by the
 * framework when the bundle associated with the BundleContext used to create this {@code ServiceObjects} object is
 * stopped.
 */
import { ServiceReference } from './service-reference';

export interface ServiceObjects<S> {
  /**
   * Returns a service object for the {@link #getServiceReference() associated} service.
   * <p>
   * This {@code ServiceObjects} object can be used to obtain multiple service objects for the associated service if the
   * service has {@link SCOPE_PROTOTYPE prototype} scope.
   * <p>
   * If the associated service has {@link SCOPE_SINGLETON singleton} or {@link SCOPE_BUNDLE bundle} scope, this method
   * behaves the same as calling the {@link BundleContext#getService(ServiceReference)} method for the associated
   * service. That is, only one, use-counted service object is available from this {@link ServiceObjects} object.
   * <p>
   * This method will always return {@code undefined} when the associated service has been unregistered.
   * <p>
   * For a prototype scope service, the following steps are required to obtain a service object:
   * <ol>
   * <li>If the associated service has been unregistered, {@code undefined} is returned.</li>
   * <li>The
   * {@link PrototypeServiceFactory#getService(Bundle, ServiceRegistration)} method is called to supply a customized
   * service object for the caller.</li>
   * <li>If the service object returned by the {@code PrototypeServiceFactory} object is {@code undefined}, not an
   * {@code instanceof} all the classes named when the service was registered or the {@code PrototypeServiceFactory}
   * object throws an error, {@code undefined} is returned and a Framework event of type {@link ERROR} containing a
   * {@link ServiceException} describing the error is fired.</li>
   * <li>The use count for the customized service object is incremented by one.</li>
   * <li>The customized service object is returned.</li>
   * </ol>
   *
   * @return A service object for the associated service or {@code undefined} if the service is not registered, the
   *         customized service object returned by a {@code ServiceFactory} does not implement the classes under which
   *         it was registered or the {@code ServiceFactory} threw an exception.
   */
  getService(): S | undefined;

  /**
   * Releases a service object for the {@link #getServiceReference() associated} service.
   * <p>
   * This {@code ServiceObjects} object can be used to obtain multiple service objects for the associated service if the
   * service has {@link SCOPE_PROTOTYPE prototype} scope. If the associated service has
   * {@link SCOPE_SINGLETON singleton} or {@link SCOPE_BUNDLE bundle} scope, this method behaves the same as calling the
   * {@link BundleContext#ungetService(ServiceReference)} method for the associated service. That is, only one,
   * use-counted service object is available from this {@link ServiceObjects} object.
   * <p>
   * For a prototype scope service, the following steps are required to release a service object:
   * <ol>
   * <li>If the associated service has been unregistered, this method returns without doing anything.</li>
   * <li>The use count for the specified service object is decremented by one.</li>
   * <li>If the use count for the specified service object is now zero, the
   * {@link PrototypeServiceFactory#ungetService(Bundle, ServiceRegistration, any)} method is called to release the
   * specified service object.</li>
   * </ol>
   * <p>
   * The specified service object must no longer be used and all references to it should be destroyed after calling this
   * method when the use count has returned to zero.
   *
   * @param service A service object previously provided by this {@code ServiceObjects} object.
   */
  ungetService(service: S): void;

  /**
   * Returns the {@link ServiceReference} for the service associated with this {@code ServiceObjects} object.
   *
   * @return The {@link ServiceReference} for the service associated with this {@code ServiceObjects} object.
   */
  getServiceReference(): ServiceReference<S>;
}
