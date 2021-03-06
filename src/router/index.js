/* eslint-disable */
import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getStorage } from '@/utils/handleStorage'
// // import { userInfo } from '@/api/base/'
// // import { logout } from '@/api/base'
import errRouterMap from '@/router/base/error'
import { formatMenuMap, getMenuIndex } from '@/utils/handleData'
import { userInfo } from '@/mock/'

import HandleToken from '@/utils/auth'
const handleToken = new HandleToken()

import baseRouterMap from './base/'
Vue.use(Router)
console.log(baseRouterMap)
const router = new Router({
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  routes: baseRouterMap
})

NProgress.configure({ showSpinner: false }) // 页面加载滚动条的设置


router.beforeEach((to, from, next) => {
  if (!to.meta.noCache) {
    if (to.name !== null) {
      store.commit('ADD_VISITED_VIEWS', to)
    }
  }
  // 开始滚动条
  NProgress.start()
  document.querySelector('#nprogress .bar').style.background = store.getters.themeColor

  resetStore()
  // 如果有token的缓存
  if (handleToken.getToken()) {
    if (store.getters.menuMap === null) { // 判断当前用户还没有拉取完user_info信息，所以权限数据的长度为0
      // userInfo().then((res) => {
        const data = userInfo.data
        // 获取当前版本并加载当前版本的路由
        // const frontVersion = getVersion(store.getters.frontVersion)
        store.commit('SET_BASE_INFO', data.baseInfo)
        let routers = require('@/router/admin/').default
        routers = [].concat(routers, errRouterMap)
        router.addRoutes(routers)

        // 初始化菜单和默认显示菜单
        let menuMap = formatMenuMap(data.permission)
        const menuIndex = getMenuIndex(menuMap)
        const moduleMenuIndex = getStorage('moduleMenuIndex')
        const firstMenuIndex = getStorage('firstMenuIndex')
        const secondMenuIndex = JSON.parse(getStorage('secondMenuIndex'))
        const currentPath = getStorage('currentPath')
        store.commit('SET_MENU_MAP', menuMap)
        if (to.path === '/') {
          const secondMenu = menuMap[0].children[0].children[0]
          store.commit('SET_MENU_INDEX', [0, secondMenu, secondMenu.url])
        } else if (to.path == currentPath) {
          store.commit('SET_MENU_INDEX', [moduleMenuIndex, secondMenuIndex, currentPath])
        } else if (menuIndex.hasOwnProperty(to.path)) {
          store.commit('SET_MENU_INDEX', menuIndex[to.path])
        } else {
          store.commit('SET_MENU_INDEX', [moduleMenuIndex, secondMenuIndex, to.fullPath])
        }
      // }).catch((err) => {
      //   console.error('获取用户信息失败 or 用户信息处理失败', err)
      //   // next({ path: '/' })
      //   logout().then(res => {
      //     handleToken.removeToken()
      //     router.push({ path: '/login' })
      //   })
      // })
    } else {
      if (store.getters.baseInfo.loginType === '1' && to.path !== '/changePassword') {
        next({ path: '/changePassword', replace: true })
        return
      }

      // 如果通过链接直接跳转某个页面，且该页面是二级页面
      let menuMap = store.getters.menuMap
      const menuIndex = getMenuIndex(menuMap)
      const path = to.meta.pubPage || to.path
      if (menuIndex.hasOwnProperty(path)) {
        const setMenuIndex = menuIndex[path]
        store.commit('SET_MENU_INDEX_NO', setMenuIndex)
      }
      next()
    }
  } else { // 如果没有token缓存
    next('/login') // 否则全部重定向到登录页
    NProgress.done() // 如果当前页面是登录的，就会触发afterEach钩子，所以需要手动关闭滚动条

  }
})

router.afterEach((to, from) => {
  store.commit('SET_CURRENT_PATH', to.fullPath)
  if (!to.meta.mustCache) {
    if (to.name !== null) {
      store.commit('DEL_VISITED_VIEWS', from)
    }
  }
  // 结束滚动条
  NProgress.done()
})

function resetStore () {
  // 重置公共状态
  const getters = store.getters
  if (getters.tableSelectArr.length !== 0) {
    store.commit('SET_TABLE_SELECT_ARR', [])
  }
  if (getters.pageTitle !== '') {
    store.commit('SET_PAGE_TITLE', '')
  }

  if (getters.tableSelectArr.length !== 0) {
    store.commit('SET_TABLE_SELECT_ARR', [])
  }
}

export default router