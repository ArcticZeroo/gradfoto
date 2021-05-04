import { IGradfotoImagesResponse, isGradfotoImagesResponse } from './models/gradfoto';
import { isInstance } from './typeguard';

const retrieveSelfButton = document.querySelector('#retrieve-self');
const retrieveCandidButton = document.querySelector('#retrieve-candids');

const dataInputForm = document.querySelector('#data-input');
const customerIdInput = document.querySelector('#customer-number');
const lastNameInput = document.querySelector('#last-name');
const resultsDiv = document.querySelector('#results');
const thumbnailTrimRegex = /t$/;

const customerIdQueryName = 'id';
const lastNameQueryName = 'ln';
// const retrieveMineQueryName = 'rm';
const retrieveCandidsQueryName = 'rc';

if (!isInstance(retrieveSelfButton, HTMLButtonElement)) {
    throw new Error('Missing retrieve self button.');
}

if (!isInstance(retrieveCandidButton, HTMLButtonElement)) {
    throw new Error('Missing retrieve self button.');
}

if (!isInstance(dataInputForm, HTMLFormElement)) {
    throw new Error('Missing data input form.');
}

if (!isInstance(customerIdInput, HTMLInputElement) || !isInstance(lastNameInput, HTMLInputElement)) {
    throw new Error('Missing customer ID or last name');
}

if (!isInstance(resultsDiv, HTMLDivElement)) {
    throw new Error('Missing results.');
}

let isRetrieveInProgress = false;

const setRetrieving = (newIsRetrieving: boolean) => {
    retrieveSelfButton.disabled = newIsRetrieving;
    retrieveCandidButton.disabled = newIsRetrieving;
    isRetrieveInProgress = newIsRetrieving;
};

const createCard = (): HTMLElement => Object.assign(document.createElement('div'), {
    className: 'card'
});

const clearContents = (element: HTMLElement) => element.innerHTML = '';

interface IGrabImagesParams {
    lastName: string;
    customerId: string;
    shouldRetrieveCandids?: boolean;
}

const grabImages = async ({ lastName, customerId, shouldRetrieveCandids }: IGrabImagesParams) => {
    const params: Record<string, string> = {
        [customerIdQueryName]: customerId,
        [lastNameQueryName]: lastName
    };

    if (shouldRetrieveCandids) {
        params[retrieveCandidsQueryName] = 'true';
    }

    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(`/api/grabber?${queryString}`);

    if (!response.ok) {
        throw new Error('Request to retrieve self data failed');
    }

    const json = await response.json();

    if (!isGradfotoImagesResponse(json)) {
        console.error('Response is not a gradfoto response:', json);
        throw new Error('Response is not a gradfoto response');
    }

    return json;
};

const toFullResolutionUrl = (thumbnailUrl: string) => {
    // Literally just removes the "t" on the end of an image URL. In case they have any non-JPG URLs, basically.
    // e.g. [...]/033t.jpg -> [...]/033.jpg
    const thumbnailUrlObject = new URL(thumbnailUrl);
    const thumbnailPathname = thumbnailUrlObject.pathname;
    const [thumbnailName, thumbnailExtension] = thumbnailPathname.split('.');

    if (!thumbnailName || !thumbnailExtension) {
        throw new Error('Thumbnail name or extension are null/empty');
    }

    const imageName = thumbnailName.replace(thumbnailTrimRegex, '');
    return `${thumbnailUrlObject.origin}${imageName}.${thumbnailExtension}`;
};

const onResultsRetrieved = (results: IGradfotoImagesResponse) => {
    const titleDiv = Object.assign(document.createElement('div'), {
        innerText: 'Click any thumbnail below to open the full-size image.',
        className: 'title'
    });

    resultsDiv.appendChild(titleDiv);

    const resultCards = Object.assign(document.createElement('div'), {
        className: 'grid'
    });

    for (const thumbnailUrl of results.imageUrls) {
        const fullResolutionUrl = toFullResolutionUrl(thumbnailUrl);

        const image = Object.assign(document.createElement('img'), {
            src: thumbnailUrl
        });

        const fullResolutionLink = Object.assign(document.createElement('a'), {
            href:   fullResolutionUrl,
            target: '_blank'
        });

        fullResolutionLink.appendChild(image);
        resultCards.appendChild(fullResolutionLink);
    }

    resultsDiv.appendChild(resultCards);
};

const onFailure = () => {
    const card = createCard();
    card.innerText = 'Unable to retrieve results. Try again?';
    resultsDiv.appendChild(card);
};

const submitAndRetrieve = (params: Partial<IGrabImagesParams> = {}) => {
    if (isRetrieveInProgress) {
        return;
    }

    const customerId = customerIdInput.value;
    let lastName = lastNameInput.value;

    if (!customerId || !lastName) {
        alert('Your customer ID or last name are missing.');
        return;
    }

    lastName = lastName.padEnd(3, ' ').slice(0, 3);

    setRetrieving(true);

    resultsDiv.innerText = 'Retrieving photos...';

    grabImages({ lastName, customerId, ...params })
        .finally(() => {
            setRetrieving(false);
            clearContents(resultsDiv);
        })
        .then(onResultsRetrieved)
        .catch(onFailure);
};

retrieveSelfButton.addEventListener('click', () => submitAndRetrieve());
retrieveCandidButton.addEventListener('click', () => submitAndRetrieve({
    shouldRetrieveCandids: true
}));
