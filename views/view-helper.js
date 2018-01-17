R      = require('ramda');
moment = require('moment');
moment.locale('ru');

module.exports = {
  createNameHouse: R.compose(
                    R.join(' ')
                  , R.ifElse(
                      R.compose(R.isEmpty, R.prop('street_new_rus'))
                      , R.juxt([
                          R.prop('street_rus')
                        , R.always('')
                        , R.prop('name_rus')
                        , R.always(',')
                        , R.prop('building')
                        ])
                      , R.juxt([
                          R.prop('street_new_rus')
                        , R.always('')
                        , R.prop('name_new_rus')
                        , R.always(',')
                        , R.prop('building')
                        , R.always('(стр.наз.')
                        , R.prop('street_rus')
                        , R.always('')
                        , R.prop('name_rus')
                        , R.always(')')
                        ]))
                  )

, inicialName: R.compose(
                R.join(' ')
              , R.flatten
              , R.juxt([R.head, R.compose(R.map(R.compose(R.concat(R.__,'.'), (R.head))), R.tail)])
              , R.map(R.join(''))
              , R.map(R.juxt([R.compose(R.toUpper, R.head), R.compose(R.toLower, R.tail)]))
              , R.split(' ')
              )

, checkUserRule: (rule, userRulelist) =>
                    R.any(R.whereEq({name: rule}), userRulelist)

, filterFile: (arr, type) => {

    if (R.equals('photo', type)) {
      return R.compose(
              R.sort(R.descend(R.nth(0)))
            , R.toPairs
            , R.groupBy(item => moment(item.createdAt).format("YYYY-MM-DD"))
            , R.filter(item => R.prop('type', item) == type)
            )(arr)
    } else {
      return R.filter(item => R.prop('type', item) == type)(arr)
    }

  }

, groupHouseByDistrictAndSector: R.compose(
                                  R.map(R.groupBy(R.prop('sector')))
                                , R.groupBy(R.prop('district'))
                                )

, addBorderStyle: R.cond([
                    [R.equals('add'),     R.always('border-add')],
                    [R.equals('close'),   R.always('border-close')],
                    [R.equals('active'),  R.always('border-active')],
                    [R.equals('deleted'), R.always('border-deleted')],
                    [R.T,                 R.always('border-default')]
                  ])

, tooltipTitle: R.cond([
                  [R.equals('add'),     R.always('Контроль / Проверить')],
                  [R.equals('active'),  R.always('В работу')],
                  [R.equals('close'),   R.always('Завершенный')],
                  [R.equals('deleted'), R.always('Удаленый / Отсутствует')],
                  [R.T,                 R.always('Отсутствует')]
                ])

}