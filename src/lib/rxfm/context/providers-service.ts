import { Observable } from "rxjs";
import { ElementType } from "../components";

/**
 * A service class to manage providers available to elements when using contexts.
 */
class ProvidersService {
  private providerMap = new Map<symbol, { element: ElementType, value: Observable<any> }[]>();

  public getProvider(symbol: symbol, childElement: ElementType): Observable<any> | undefined {
    return this.providerMap.get(symbol)?.find(({ element }) => element.contains(childElement))?.value;
  }

  public setProvider(symbol: symbol, element: ElementType, value: Observable<any>) {
    this.providerMap.set(symbol, [{ element, value }, ...(this.providerMap.get(symbol) || [])]);
  }

  public deleteProvider(symbol: symbol, element: ElementType) {
    const filteredProviders = this.providerMap.get(symbol)?.filter(({ element: el }) => element !== el);
    if (!filteredProviders?.length) this.providerMap.delete(symbol);
    else this.providerMap.set(symbol, filteredProviders);
  }
}

/**
 * The single instance of the provider service to be used around the application.
 */
export const providersService = new ProvidersService();
