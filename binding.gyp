{
	"targets": [
		{
			"target_name": "centroid",
			"sources": [ "node_addons/centroid.cc" ],
			"cflags": ["-std=c++11"],
			"include_dirs": [
				"/opt/X11/include",
				"<!(node -e \"require('nan')\")",
				"./node_addons/include"
			],
			'cflags!': [ '-fno-exceptions'],
			'cflags_cc!': [ '-fno-exceptions' ],
			'conditions': [
				['OS=="mac"', {
					'xcode_settings': {
						'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
					},
					"link_settings": {
						"library_dirs": ["/opt/X11/lib"] 
					}
				}]
			]
		},
		{
		"target_name": "autosavefile",
		"sources": [ "node_addons/autosavefile.cc" ], 
		"include_dirs" : ["<!(node -e \"require('nan')\")"]
		}
	]
}