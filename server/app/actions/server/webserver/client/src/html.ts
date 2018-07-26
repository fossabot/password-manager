export const html = ({ 
	title, script, stylesheet,
	development = false
}: { 
	title: string,
	script: string;
	stylesheet: string;
	development?: boolean;
}) => ({
	pre: `
<!DOCTYPE HTML>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		${development ? '' : `
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com">
		`}
		<!-- TODO: select color -->
		<meta name="theme-color" content="#4285f4">
		<meta name="description" content="Your password manager dashboard">
		<title>${title}</title>
		<link href="https://fonts.googleapis.com/css?family=Roboto:400,500" rel="stylesheet">
		<link rel="stylesheet" href="${stylesheet}"/>
	</head>
	<body>
		<div id="app">`,
	post: `</div>
		<script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
		<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
		<script type="module" src="${script}"></script>
	</body>
</html>`
});