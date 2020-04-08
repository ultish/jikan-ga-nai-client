import ComputedProperty from "@ember/object/computed";
import ApolloService from "ember-apollo-client/services/apollo";

interface Opts {
  service: string;
}

export function queryManager(): ComputedProperty<ApolloService>; // @queryManager() foo, foo: queryManager()
export function queryManager(
  target: object,
  propertyKey: string | symbol
): void; // @queryManager foo
export function queryManager<T = ApolloService>(
  opts: Opts
): ComputedProperty<T>; // @queryManager({service: 'name'})
