import Vue, { PluginObject, PluginFunction } from 'vue'

export class VueFetchMockPlugin implements PluginObject<{}> {
  install: PluginFunction<{}>
  static install(pVue: typeof Vue, options?: {} | undefined): void
}

export class VueFetchMock extends Vue {}