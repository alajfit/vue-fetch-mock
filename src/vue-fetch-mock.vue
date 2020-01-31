<template>
  <div>
    <slot>Issues Mounting Component</slot>
  </div>
</template>

<script>
import fetchMock from 'fetch-mock'

export default {
    name: 'VueFetchMock',
    props: {
        logger: {
            type: Boolean,
            default: false
        },
        throttle: {
            type: Number,
            default: 300
        },
        mocks: {
            type: Array,
            default: () => []
        }
    },
    beforeMount() {
        this.mock()
    },
    beforeDestroy() {
        if (fetchMock.__prevProxy === this) this.unmock()
    },
    methods: {
        mock() {
            this.unmock()
            const mocks = this.mocks
            if (mocks) {
                mocks.forEach(mock => {
                    fetchMock.mock(Object.assign({}, mock, {
                        response: (url, opts) => {
                            if (this.logger) console.info('fetch', url, opts)
                            let result = {
                                body: mock.response,
                                headers: new Headers({
                                    'content-type': 'application/json',
                                }),
                            }

                            if (
                                mock.response.hasOwnProperty('body') ||
                                mock.response.hasOwnProperty('status') ||
                                mock.response.hasOwnProperty('headers')
                            ) {
                                result = Object.assign({},
                                    result,
                                    mock.response
                                )
                            }
                            
                            return this.throttle
                                ? new Promise(resolve => { setTimeout(() => resolve(result), this.throttle) })
                                : result
                        }
                    }))
                })

                fetchMock.catch(() => fetchMock.realFetch.apply(window, arguments.concat()))
                fetchMock.__prevProxy = this
            }
        },
        unmock() {
            if (typeof fetchMock.restore === 'function') {
                fetchMock.restore()
                delete fetchMock.__prevProxy
            }
        }
    }
}
</script>