export const POST_URL = 'https://script.google.com/macros/s/AKfycbzUK67SefpoVebQTH3SJLdc8q-uWLxpSqBZBhbF/exec';

export const GET_URL = function(params) {
	params = params || {};
	const baseUrl = POST_URL;
	const sheetname = params.sheetname || '';
	const action = params.action || '';
	return `${baseUrl}?sheetname=${sheetname}&action=${action}&${new Date().toString()}`;
};

const ssid = '13AuEKpgsQEY5UHOUrG0ryV6sjlMcPHMTZZ8KmETR_Bo';
export const DOWNLOAD_XLSX = `https://docs.google.com/spreadsheets/d/${ssid}/export?format=xlsx`; //&gid=