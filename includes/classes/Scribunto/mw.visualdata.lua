-- @credits: https://github.com/Open-CSP/WSSlots/tree/master/src/Scribunto

-- Variable instantiation
local visualdata = {}
local php

function visualdata.setupInterface()
    -- Interface setup
    visualdata.setupInterface = nil
    php = mw_interface
    mw_interface = nil

    -- Register library within the "mw.visualdata" namespace
    mw = mw or {}
    mw.visualdata = visualdata

    package.loaded['mw.visualdata'] = visualdata
end


function visualdata.query( schema, query, printouts )
    if not type( schema ) == 'string' or not type( query ) == 'string' then
        error( 'Invalid parameter type supplied to mw.visualdata.query()' )
    end

    return php.query( schema, query, printouts )
end


return visualdata
